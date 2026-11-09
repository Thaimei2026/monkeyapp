package com.thaimei.myapp.model;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Setter;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import com.thaimei.myapp.enums.RefundStatus;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class RefundModel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(nullable = false)
    private Long id;

    @JoinColumn(nullable = false)
    @ManyToOne
    private Orders order;

    @JoinColumn(nullable = false)
    @ManyToOne
    private OrderItems orderItem;

    @Column(nullable = false)
    private Integer quantity;
    //precision = the total number of digits stored counting both sides of the decimal
    //scale = how many of those digits are after the decimal point
    @Column(nullable = false, precision = 19, scale= 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RefundStatus status;

    @Column(length = 500)
    private String rejectionReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;
    
}
