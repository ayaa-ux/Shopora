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

/** Une commande complète vue par le CLIENT. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private LocalDateTime createdAt;
    private PaymentMethod paymentMethod;
    private BigDecimal total;

    // Statut global = celui de la ligne la MOINS avancée (la commande n'est
    // "Livrée" que lorsque toutes ses lignes le sont).
    private OrderStatus status;

    private String firstName;
    private String lastName;
    private String address;
    private String city;
    private String phone;

    private List<OrderItemResponse> items;
}
