package com.thaimei.myapp.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.thaimei.myapp.enums.ReturnItemStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
@Getter
@Setter 
@AllArgsConstructor
@NoArgsConstructor
public class OrderItems {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private int quantity;
    
    //multiple orderItems across different orders pointing to the same product.
    @ManyToOne
    @JoinColumn(name = "products_id", nullable=false)
    private ProductsModel product;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false )
    private Orders orders;

    @Column(nullable = false)
    private String productNameAtPurchase;

    @Column(nullable = false)
    private BigDecimal priceAtPurchase;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReturnItemStatus status = ReturnItemStatus.NOT_REQUESTED;

    private LocalDateTime requestedAt;

    @Column(nullable = false)
    private boolean cancelled = false;

    private LocalDateTime cancelledAt;
}
