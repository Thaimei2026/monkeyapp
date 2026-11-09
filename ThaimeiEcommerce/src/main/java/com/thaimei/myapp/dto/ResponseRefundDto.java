package com.thaimei.myapp.dto;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.thaimei.myapp.enums.RefundStatus;

import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseRefundDto {
    private Long id;
    private RefundStatus status;
    private String ItemName;
    private Integer quantity;
    private BigDecimal amount;
    private LocalDateTime requestedAt;
    private String rejectionReason;
}
