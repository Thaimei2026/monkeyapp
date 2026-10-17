package com.thaimei.myapp.controller.sellers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.data.domain.Slice;

import com.thaimei.myapp.dto.sellersDto.SellerOrdersResponse;
import com.thaimei.myapp.dto.sellersDto.UpdateOrderStatus;
import com.thaimei.myapp.security.CustomUserDetails;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.Map;

import org.springframework.data.domain.PageRequest;
import com.thaimei.myapp.service.OrderService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/sellers")
public class SellerOrdersController {

    
    private final OrderService orderService;
    public SellerOrdersController ( OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public ResponseEntity <Slice<SellerOrdersResponse>> getAllOrdersForSeller(@RequestParam (defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Pageable pageable = PageRequest.of(page, size);
        Slice<SellerOrdersResponse> sellerOrders = orderService.getOrdersBySeller(customUserDetails.getUser(), pageable);
        return ResponseEntity.ok(sellerOrders);
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<Slice<SellerOrdersResponse>> getOrdersByStore(@AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20")int size, @PathVariable Long storeId) {
        Pageable pageable  = PageRequest.of(page, size);
        Slice<SellerOrdersResponse> sellerOrders = orderService.getOrderByStore(customUserDetails.getId(), pageable, storeId);
        return ResponseEntity.ok(sellerOrders);
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@Valid @RequestBody UpdateOrderStatus statusDto, @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long orderId) {
        orderService.updateOrderStatus(statusDto, userDetails.getId(), orderId);
        return ResponseEntity.ok(Map.of("message","status updated successfully!"));
    }
    // order status (pending, placed)
}
