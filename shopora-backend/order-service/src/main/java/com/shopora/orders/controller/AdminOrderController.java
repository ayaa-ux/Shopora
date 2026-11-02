package com.shopora.orders.controller;

import com.shopora.orders.dto.AdminOrderResponse;
import com.shopora.orders.dto.AdminStatsResponse;
import com.shopora.orders.dto.UpdateStatusRequest;
import com.shopora.orders.service.AdminOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Supervision des ventes par l'administrateur (ADMIN uniquement). */
@RestController
@RequestMapping("/api/orders/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping("/all")
    public ResponseEntity<List<AdminOrderResponse>> getAllOrders() {
        return ResponseEntity.ok(adminOrderService.getAllOrders());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminOrderService.getStats());
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<AdminOrderResponse> updateItemStatus(@PathVariable Long itemId,
                                                               @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(adminOrderService.updateItemStatus(itemId, request.getStatus()));
    }
}
