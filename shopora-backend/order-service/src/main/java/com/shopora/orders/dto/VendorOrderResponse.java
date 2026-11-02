package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Une ligne de commande vue par le VENDEUR : uniquement SES produits,
 * avec les informations de livraison dont il a besoin pour expédier.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorOrderResponse {

    private Long itemId;
    private String orderNumber;
    private LocalDateTime createdAt;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal amount;
    private OrderStatus status;

    private String clientEmail;
    private String clientName;
    private String address;
    private String city;
    private String phone;
}
