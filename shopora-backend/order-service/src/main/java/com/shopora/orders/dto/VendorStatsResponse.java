package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Statistiques réelles d'un vendeur sur les 30 derniers jours. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatsResponse {

    private BigDecimal totalRevenue;
    private long ordersCount;
    private long itemsSold;
    private BigDecimal averageBasket;
    private List<DayRevenue> revenueByDay;
    private List<TopProduct> topProducts;
    private Map<OrderStatus, Long> statusCounts;

    public record DayRevenue(String day, BigDecimal revenue) { }

    public record TopProduct(String name, long sales) { }
}
