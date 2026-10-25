package com.thaimei.myapp.dto;

import java.math.BigDecimal;

import com.thaimei.myapp.enums.ReturnItemStatus;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 

public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productNameAtPurchase;
    private BigDecimal priceAtPurchase;
    private int quantity;
    private String imageURL;
    private boolean cancelled;
    private ReturnItemStatus status;
}
