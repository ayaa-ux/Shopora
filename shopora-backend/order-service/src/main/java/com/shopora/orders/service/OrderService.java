package com.shopora.orders.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.shopora.orders.dto.CreateOrderRequest;
import com.shopora.orders.dto.OrderItemResponse;
import com.shopora.orders.dto.OrderResponse;
import com.shopora.orders.dto.VendorOrderResponse;
import com.shopora.orders.dto.VendorStatsResponse;
import com.shopora.orders.entity.Order;
import com.shopora.orders.entity.OrderItem;
import com.shopora.orders.entity.OrderStatus;
import com.shopora.orders.exception.CatalogUnavailableException;
import com.shopora.orders.repository.OrderItemRepository;
import com.shopora.orders.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@Slf4j
public class OrderService {

    private static final int STATS_DAYS = 30;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestClient catalogClient;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        @Value("${catalog.service-url}") String catalogUrl,
                        @Value("${internal.api-key:shopora-internal-dev-key}") String internalKey) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.catalogClient = RestClient.builder().baseUrl(catalogUrl)
                .defaultHeader("X-Internal-Key", internalKey)
                .requestFactory(factory).build();
    }

    /** Offre telle que renvoyée par catalog-service (seuls les champs utiles). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record CatalogOffer(Long id, Long productId, String productName, String vendorEmail,
                                BigDecimal price, Integer stockQuantity) { }

    // ─── Client ───────────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String clientEmail) {

        // Plusieurs lignes pour la même offre -> on additionne les quantités
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (CreateOrderRequest.Item item : request.getItems()) {
            quantities.merge(item.getOfferId(), item.getQuantity(), Integer::sum);
        }

        Order order = Order.builder()
                .clientEmail(clientEmail)
                .paymentMethod(request.getPaymentMethod())
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .postalCode(request.getPostalCode())
                .phone(request.getPhone())
                .total(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        // Stock déjà réservé dans le catalogue : rendu si la commande échoue plus loin
        Map<Long, Integer> reserved = new LinkedHashMap<>();

        try {
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            // Prix, nom et vendeur viennent du CATALOGUE, jamais du navigateur
            CatalogOffer offer = fetchOffer(entry.getKey());
            int quantity = entry.getValue();

            if (offer.stockQuantity() != null && quantity > offer.stockQuantity()) {
                throw new IllegalStateException("Stock insuffisant pour « " + offer.productName()
                        + " » (disponible : " + offer.stockQuantity() + ").");
            }

            reserveStock(offer, quantity);
            reserved.put(offer.id(), quantity);

            OrderItem item = OrderItem.builder()
                    .offerId(offer.id())
                    .productId(offer.productId())
                    .productName(offer.productName())
                    .vendorEmail(offer.vendorEmail())
                    .unitPrice(offer.price())
                    .quantity(quantity)
                    .build();
            order.addItem(item);
            total = total.add(item.getLineTotal());
        }

        order.setTotal(total);
        orderRepository.save(order);                                   // l'id est généré ici
        order.setOrderNumber(String.format("SO%06d", order.getId()));  // enregistré au commit

        log.info("Commande {} créée par {} : {} ligne(s), total {} MAD",
                order.getOrderNumber(), clientEmail, order.getItems().size(), total);

        return mapToOrderResponse(order);

        } catch (RuntimeException e) {
            releaseStock(reserved);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String clientEmail) {
        return orderRepository.findByClientEmailOrderByCreatedAtDesc(clientEmail).stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    // ─── Vendeur ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VendorOrderResponse> getVendorOrders(String vendorEmail) {
        return orderItemRepository.findByVendorEmailOrderByOrder_CreatedAtDesc(vendorEmail).stream()
                .map(this::mapToVendorResponse)
                .toList();
    }

    /**
     * Le vendeur fait avancer SA ligne d'une étape (Commandé -> Confirmé -> Expédié -> Livré).
     * Il ne peut ni sauter d'étape, ni revenir en arrière, ni toucher la ligne d'un autre vendeur.
     */
    @Transactional
    public VendorOrderResponse updateItemStatus(Long itemId, OrderStatus newStatus, String vendorEmail) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Ligne de commande introuvable."));

        if (!item.getVendorEmail().equalsIgnoreCase(vendorEmail)) {
            throw new AccessDeniedException("Cette commande ne vous concerne pas.");
        }

        OrderStatus current = item.getStatus();
        if (newStatus.ordinal() != current.ordinal() + 1) {
            throw new IllegalStateException("Transition de statut invalide (" + current + " -> " + newStatus + ").");
        }

        item.setStatus(newStatus);
        orderItemRepository.save(item);
        return mapToVendorResponse(item);
    }

    @Transactional(readOnly = true)
    public VendorStatsResponse getVendorStats(String vendorEmail) {
        LocalDate today = LocalDate.now();
        LocalDateTime since = today.minusDays(STATS_DAYS - 1).atStartOfDay();

        List<OrderItem> items = orderItemRepository.findByVendorEmailAndOrder_CreatedAtAfter(vendorEmail, since);

        BigDecimal totalRevenue = items.stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long ordersCount = items.stream().map(i -> i.getOrder().getId()).distinct().count();
        long itemsSold = items.stream().mapToLong(OrderItem::getQuantity).sum();

        BigDecimal averageBasket = ordersCount == 0
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(ordersCount), 2, RoundingMode.HALF_UP);

        // Revenus par jour (les jours sans vente apparaissent à 0)
        Map<LocalDate, BigDecimal> byDay = new TreeMap<>();
        for (int i = STATS_DAYS - 1; i >= 0; i--) {
            byDay.put(today.minusDays(i), BigDecimal.ZERO);
        }
        for (OrderItem item : items) {
            byDay.merge(item.getOrder().getCreatedAt().toLocalDate(), item.getLineTotal(), BigDecimal::add);
        }
        DateTimeFormatter dayFormat = DateTimeFormatter.ofPattern("dd/MM");
        List<VendorStatsResponse.DayRevenue> revenueByDay = byDay.entrySet().stream()
                .map(e -> new VendorStatsResponse.DayRevenue(e.getKey().format(dayFormat), e.getValue()))
                .toList();

        // Top 5 produits par quantité vendue
        Map<String, Long> salesByProduct = new LinkedHashMap<>();
        for (OrderItem item : items) {
            salesByProduct.merge(item.getProductName(), (long) item.getQuantity(), Long::sum);
        }
        List<VendorStatsResponse.TopProduct> topProducts = salesByProduct.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new VendorStatsResponse.TopProduct(e.getKey(), e.getValue()))
                .toList();

        Map<OrderStatus, Long> statusCounts = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            statusCounts.put(status, 0L);
        }
        for (OrderItem item : items) {
            statusCounts.merge(item.getStatus(), 1L, Long::sum);
        }

        return VendorStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .ordersCount(ordersCount)
                .itemsSold(itemsSold)
                .averageBasket(averageBasket)
                .revenueByDay(revenueByDay)
                .topProducts(topProducts)
                .statusCounts(statusCounts)
                .build();
    }

    // ─── Catalogue ────────────────────────────────────────────────────────────

    private CatalogOffer fetchOffer(Long offerId) {
        try {
            CatalogOffer offer = catalogClient.get()
                    .uri("/api/offers/{id}", offerId)
                    .retrieve()
                    .body(CatalogOffer.class);
            if (offer == null || offer.price() == null || offer.vendorEmail() == null) {
                throw new IllegalArgumentException("Une offre de votre panier est invalide. Retirez-la du panier.");
            }
            return offer;
        } catch (HttpClientErrorException e) {
            // 4xx : l'offre n'existe plus (supprimée par le vendeur)
            throw new IllegalArgumentException("Une offre de votre panier n'existe plus. Retirez-la du panier.");
        } catch (RestClientException e) {
            throw new CatalogUnavailableException("Appel à catalog-service impossible", e);
        }
    }

    /** Retire atomiquement la quantité du stock du catalogue (409 si le stock est insuffisant). */
    private void reserveStock(CatalogOffer offer, int quantity) {
        try {
            catalogClient.post()
                    .uri("/api/offers/internal/{id}/reserve", offer.id())
                    .body(Map.of("quantity", quantity))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Conflict e) {
            throw new IllegalStateException("Stock insuffisant pour « " + offer.productName() + " ».");
        } catch (HttpClientErrorException e) {
            log.error("Réservation de stock refusée par le catalogue ({}) pour l'offre {}", e.getStatusCode(), offer.id());
            throw new IllegalArgumentException("Impossible de réserver « " + offer.productName() + " ». Retirez-la du panier.");
        } catch (RestClientException e) {
            throw new CatalogUnavailableException("Réservation de stock impossible", e);
        }
    }

    /** Compensation best-effort : rend le stock déjà réservé quand la commande échoue. */
    private void releaseStock(Map<Long, Integer> reserved) {
        reserved.forEach((offerId, quantity) -> {
            try {
                catalogClient.post()
                        .uri("/api/offers/internal/{id}/release", offerId)
                        .body(Map.of("quantity", quantity))
                        .retrieve()
                        .toBodilessEntity();
            } catch (RestClientException e) {
                log.error("ÉCHEC du retour de stock (offre {}, quantité {}) : à corriger manuellement", offerId, quantity, e);
            }
        });
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private OrderResponse mapToOrderResponse(Order order) {
        OrderStatus overall = order.getItems().stream()
                .map(OrderItem::getStatus)
                .min(Comparator.naturalOrder())
                .orElse(OrderStatus.ORDERED);

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .createdAt(order.getCreatedAt())
                .paymentMethod(order.getPaymentMethod())
                .total(order.getTotal())
                .status(overall)
                .firstName(order.getFirstName())
                .lastName(order.getLastName())
                .address(order.getAddress())
                .city(order.getCity())
                .phone(order.getPhone())
                .items(order.getItems().stream().map(this::mapToItemResponse).toList())
                .build();
    }

    private OrderItemResponse mapToItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .offerId(item.getOfferId())
                .productName(item.getProductName())
                .vendorEmail(item.getVendorEmail())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .status(item.getStatus())
                .build();
    }

    private VendorOrderResponse mapToVendorResponse(OrderItem item) {
        Order order = item.getOrder();
        return VendorOrderResponse.builder()
                .itemId(item.getId())
                .orderNumber(order.getOrderNumber())
                .createdAt(order.getCreatedAt())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .amount(item.getLineTotal())
                .status(item.getStatus())
                .clientEmail(order.getClientEmail())
                .clientName(order.getFirstName() + " " + order.getLastName())
                .address(order.getAddress())
                .city(order.getCity())
                .phone(order.getPhone())
                .build();
    }
}
