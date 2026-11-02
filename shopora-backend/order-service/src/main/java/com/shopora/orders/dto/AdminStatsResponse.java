package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import com.shopora.orders.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Statistiques globales de la plateforme (ventes). Totaux = depuis le début ; courbe = 30 derniers jours. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    private BigDecimal totalRevenue;
    private BigDecimal revenueLast30Days;
    private long ordersCount;
    private long itemsSold;
    private long uniqueClients;
    private BigDecimal averageBasket;

    private List<DayRevenue> revenueByDay;
    private List<TopProduct> topProducts;
    private List<TopVendor> topVendors;
    private Map<OrderStatus, Long> statusCounts;
    private Map<PaymentMethod, Long> paymentCounts;

    public record DayRevenue(String day, BigDecimal revenue, long orders) { }

    public record TopProduct(String name, long sales, BigDecimal revenue) { }

    public record TopVendor(String vendorEmail, long itemsSold, BigDecimal revenue) { }
}
