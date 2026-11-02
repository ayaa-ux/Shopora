package com.shopora.orders.service;

import com.shopora.orders.dto.AdminOrderResponse;
import com.shopora.orders.dto.AdminStatsResponse;
import com.shopora.orders.dto.OrderItemResponse;
import com.shopora.orders.entity.Order;
import com.shopora.orders.entity.OrderItem;
import com.shopora.orders.entity.OrderStatus;
import com.shopora.orders.entity.PaymentMethod;
import com.shopora.orders.repository.OrderItemRepository;
import com.shopora.orders.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private static final int STATS_DAYS = 30;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    /** L'admin peut corriger le statut d'une ligne (litige, erreur du vendeur...), dans les deux sens. */
    @Transactional
    public AdminOrderResponse updateItemStatus(Long itemId, OrderStatus status) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Ligne de commande introuvable."));
        item.setStatus(status);
        orderItemRepository.save(item);
        return toResponse(item.getOrder());
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        List<Order> orders = orderRepository.findAll();
        List<OrderItem> items = orders.stream().flatMap(o -> o.getItems().stream()).toList();

        BigDecimal totalRevenue = orders.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        long itemsSold = items.stream().mapToLong(OrderItem::getQuantity).sum();
        long uniqueClients = orders.stream().map(Order::getClientEmail).distinct().count();
        BigDecimal averageBasket = orders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);

        // Courbe des 30 derniers jours (les jours sans vente restent à 0)
        LocalDate today = LocalDate.now();
        LocalDateTime since = today.minusDays(STATS_DAYS - 1).atStartOfDay();
        Map<LocalDate, BigDecimal> revenueByDay = new TreeMap<>();
        Map<LocalDate, Long> ordersByDay = new TreeMap<>();
        for (int i = STATS_DAYS - 1; i >= 0; i--) {
            revenueByDay.put(today.minusDays(i), BigDecimal.ZERO);
            ordersByDay.put(today.minusDays(i), 0L);
        }
        BigDecimal revenue30 = BigDecimal.ZERO;
        for (Order o : orders) {
            if (o.getCreatedAt().isBefore(since)) continue;
            LocalDate day = o.getCreatedAt().toLocalDate();
            revenueByDay.merge(day, o.getTotal(), BigDecimal::add);
            ordersByDay.merge(day, 1L, Long::sum);
            revenue30 = revenue30.add(o.getTotal());
        }
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        List<AdminStatsResponse.DayRevenue> byDay = revenueByDay.entrySet().stream()
                .map(e -> new AdminStatsResponse.DayRevenue(e.getKey().format(fmt), e.getValue(),
                        ordersByDay.get(e.getKey())))
                .toList();

        // Top produits (quantités) et top vendeurs (chiffre d'affaires)
        Map<String, long[]> qtyByProduct = new HashMap<>();
        Map<String, BigDecimal> revByProduct = new HashMap<>();
        Map<String, long[]> qtyByVendor = new HashMap<>();
        Map<String, BigDecimal> revByVendor = new HashMap<>();
        for (OrderItem item : items) {
            qtyByProduct.computeIfAbsent(item.getProductName(), k -> new long[1])[0] += item.getQuantity();
            revByProduct.merge(item.getProductName(), item.getLineTotal(), BigDecimal::add);
            qtyByVendor.computeIfAbsent(item.getVendorEmail(), k -> new long[1])[0] += item.getQuantity();
            revByVendor.merge(item.getVendorEmail(), item.getLineTotal(), BigDecimal::add);
        }
        List<AdminStatsResponse.TopProduct> topProducts = qtyByProduct.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> new AdminStatsResponse.TopProduct(e.getKey(), e.getValue()[0], revByProduct.get(e.getKey())))
                .toList();
        List<AdminStatsResponse.TopVendor> topVendors = revByVendor.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> new AdminStatsResponse.TopVendor(e.getKey(), qtyByVendor.get(e.getKey())[0], e.getValue()))
                .toList();

        Map<OrderStatus, Long> statusCounts = new EnumMap<>(OrderStatus.class);
        for (OrderStatus s : OrderStatus.values()) statusCounts.put(s, 0L);
        for (OrderItem item : items) statusCounts.merge(item.getStatus(), 1L, Long::sum);

        Map<PaymentMethod, Long> paymentCounts = new EnumMap<>(PaymentMethod.class);
        for (PaymentMethod p : PaymentMethod.values()) paymentCounts.put(p, 0L);
        for (Order o : orders) paymentCounts.merge(o.getPaymentMethod(), 1L, Long::sum);

        return AdminStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .revenueLast30Days(revenue30)
                .ordersCount(orders.size())
                .itemsSold(itemsSold)
                .uniqueClients(uniqueClients)
                .averageBasket(averageBasket)
                .revenueByDay(byDay)
                .topProducts(topProducts)
                .topVendors(topVendors)
                .statusCounts(statusCounts)
                .paymentCounts(paymentCounts)
                .build();
    }

    private AdminOrderResponse toResponse(Order order) {
        OrderStatus overall = order.getItems().stream()
                .map(OrderItem::getStatus)
                .min(Comparator.naturalOrder())
                .orElse(OrderStatus.ORDERED);

        return AdminOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .createdAt(order.getCreatedAt())
                .clientEmail(order.getClientEmail())
                .clientName(order.getFirstName() + " " + order.getLastName())
                .city(order.getCity())
                .phone(order.getPhone())
                .paymentMethod(order.getPaymentMethod())
                .total(order.getTotal())
                .status(overall)
                .items(order.getItems().stream().map(i -> OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .offerId(i.getOfferId())
                        .productName(i.getProductName())
                        .vendorEmail(i.getVendorEmail())
                        .unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .lineTotal(i.getLineTotal())
                        .status(i.getStatus())
                        .build()).toList())
                .build();
    }
}
