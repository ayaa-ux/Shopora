package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import com.shopora.orders.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Une commande vue par l'ADMIN : client + lignes (chaque ligne a son vendeur et son statut). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderResponse {

    private Long id;
    private String orderNumber;
    private LocalDateTime createdAt;
    private String clientEmail;
    private String clientName;
    private String city;
    private String phone;
    private PaymentMethod paymentMethod;
    private BigDecimal total;
    private OrderStatus status;
    private List<OrderItemResponse> items;
}
