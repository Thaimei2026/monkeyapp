package com.thaimei.myapp.controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.thaimei.myapp.dto.OrderPlaceDto;
import com.thaimei.myapp.dto.OrderResponseDto;

import com.thaimei.myapp.dto.ReturnOrderDto;
import com.thaimei.myapp.error.AppException;
import com.thaimei.myapp.service.OrderService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;


import com.thaimei.myapp.security.CustomUserDetails;
import com.thaimei.myapp.repository.UserRepository;
import com.thaimei.myapp.model.User;
import java.util.Map;
import com.thaimei.myapp.dto.CancelOrderDto;


@RestController
@RequestMapping("/customers")
public class OrderController {
    private final OrderService orderService;
    
    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
    }

    @PostMapping("/buyNowCheckout")
    public ResponseEntity<?> buynow (@Valid @RequestBody OrderPlaceDto orderDto, @AuthenticationPrincipal CustomUserDetails principal) {
        if (orderDto.getOrderItems().size() != 1) {
            throw new AppException("buynow excepts only one item", 400);
        }
        User  user=principal.getUser();
        String clientSecret = orderService.checkout(orderDto, user);
        return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
    }

    @PostMapping("/CartCheckout")
    public ResponseEntity<?> checkoutFromCart (@Valid @RequestBody OrderPlaceDto orderDto, @AuthenticationPrincipal CustomUserDetails principal) {
        User  user=principal.getUser();
        String clientSecret = orderService.checkout(orderDto, user);
        return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
    }

    
    @GetMapping("/GetOrder")
    public ResponseEntity<List<OrderResponseDto>> getOrders(@AuthenticationPrincipal CustomUserDetails principal) {
        User user=principal.getUser();
        List<OrderResponseDto>orders=orderService.getOrdersByUserId(user);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/returnProducts")
    public ResponseEntity<?> returnProducts(@Valid ReturnOrderDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {
        orderService.markItemsReturned(dto.getItemIds(), userDetails.getId());
        return ResponseEntity.ok(Map.of("message","choose a refund or replacement Item"));
    }

    @PatchMapping("/cancel")
    public ResponseEntity<?> cancelOrder(@Valid @RequestBody CancelOrderDto cancel, @AuthenticationPrincipal CustomUserDetails userDetails) {

    }
}
