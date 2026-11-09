package com.thaimei.myapp.dto;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.thaimei.myapp.enums.RefundStatus;

import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class UserSideRefundDto {
    private Long id;
    private String itemName;
    private Integer quantity;
    private BigDecimal amount;
    private RefundStatus status;
    private LocalDateTime createdAt;
    private String rejectionReason;
}
