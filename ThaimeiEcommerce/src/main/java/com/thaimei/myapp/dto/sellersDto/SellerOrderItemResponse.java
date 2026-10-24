package com.thaimei.myapp.dto.sellersDto;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
@Data 
@AllArgsConstructor 
@NoArgsConstructor 

public class SellerOrderItemResponse {
    private String productName;
    private int quantity;
}
