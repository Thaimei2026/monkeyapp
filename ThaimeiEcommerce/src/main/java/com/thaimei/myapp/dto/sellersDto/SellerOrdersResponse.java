package com.thaimei.myapp.dto.sellersDto;
import lombok.Data;

import java.util.List;

import com.thaimei.myapp.enums.OrderStatusEnum;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor

public class SellerOrdersResponse {
    private Long id;
    private String name;
    private int totalPrice;
    OrderStatusEnum status;
    List<SellerOrderItemResponse> items;
}
