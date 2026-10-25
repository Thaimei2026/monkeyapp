package com.thaimei.myapp.dto;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.thaimei.myapp.enums.OrderStatusEnum;
@Data
@NoArgsConstructor
@AllArgsConstructor

public class OrderResponseDto {
    private Long id;
    
    private OrderStatusEnum status;
    
    private BigDecimal totalPrice;
    
    private LocalDateTime creationTime;

    private List<OrderItemDto> orderItems;

}
