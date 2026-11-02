package com.shopora.orders.dto;

import com.shopora.orders.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Le statut est obligatoire")
    private OrderStatus status;
}
