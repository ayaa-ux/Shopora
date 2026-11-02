package com.shopora.orders.controller;

import com.shopora.orders.dto.CreateOrderRequest;
import com.shopora.orders.dto.OrderResponse;
import com.shopora.orders.dto.UpdateStatusRequest;
import com.shopora.orders.dto.VendorOrderResponse;
import com.shopora.orders.dto.VendorStatsResponse;
import com.shopora.orders.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ─── CLIENT ───────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                                     @AuthenticationPrincipal String clientEmail) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request, clientEmail));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal String clientEmail) {
        return ResponseEntity.ok(orderService.getMyOrders(clientEmail));
    }

    // ─── VENDOR ───────────────────────────────────────────────────────────────

    @GetMapping("/vendor")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<VendorOrderResponse>> getVendorOrders(@AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(orderService.getVendorOrders(vendorEmail));
    }

    @GetMapping("/vendor/stats")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorStatsResponse> getVendorStats(@AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(orderService.getVendorStats(vendorEmail));
    }

    @PatchMapping("/vendor/items/{itemId}/status")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorOrderResponse> updateItemStatus(@PathVariable Long itemId,
                                                                @Valid @RequestBody UpdateStatusRequest request,
                                                                @AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(orderService.updateItemStatus(itemId, request.getStatus(), vendorEmail));
    }
}
