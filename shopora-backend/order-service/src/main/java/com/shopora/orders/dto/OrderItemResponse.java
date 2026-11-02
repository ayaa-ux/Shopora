package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Une ligne de commande vue par le CLIENT. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private Long id;
    private Long productId;
    private Long offerId;
    private String productName;
    private String vendorEmail;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
    private OrderStatus status;
}
