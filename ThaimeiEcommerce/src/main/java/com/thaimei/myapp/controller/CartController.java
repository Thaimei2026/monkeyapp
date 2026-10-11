package com.thaimei.myapp.controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.thaimei.myapp.service.CartService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.thaimei.myapp.dto.AddItem;
import com.thaimei.myapp.enums.QuantityAction;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.thaimei.myapp.security.CustomUserDetails;
import java.util.Map;




@RestController
@RequestMapping("/Cart")
public class CartController {
    private final CartService cartService;
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }
    
    @GetMapping("/getItems")
    public ResponseEntity<?> getMyCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return  ResponseEntity.ok(cartService.getCartByUserId(userDetails.getId()));
    }
    
    @PostMapping("/AddItems")
    public ResponseEntity<?> addItems(@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody AddItem addItem) {
        long userId = userDetails.getId();
        cartService.addItemsToCart(addItem, userId);
        return ResponseEntity.ok(Map.of("message","Items added to cart"));
    } 

    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> removeCartItem( @PathVariable Long itemId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getId();
        cartService.removeItems(itemId, userId);
        return ResponseEntity.ok(Map.of("message","item removed"));
    }

    @PatchMapping("/{itemId}")
    public ResponseEntity<Map<String, String>> updateCartItemQuantity(@PathVariable Long itemId, @RequestParam QuantityAction action, @AuthenticationPrincipal CustomUserDetails userDetails) {
        int change = (action == QuantityAction.INCREASE) ? 1 : -1;
        cartService.changeQuantity(itemId, userDetails.getId(), change);
        return ResponseEntity.ok(Map.of("message", "Quantity updated successfully"));
        
    }
}
    


    

