package com.hutech.NguyenNgocDuy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "coupons")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String code;

    @Column(name = "discount_value")
    private double discountValue;

    @Column(name = "points_cost")
    private int pointsCost;

    private boolean used;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    public boolean isValid() {
        return !used && expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
    }

    public String getDiscountFormatted() {
        return java.text.NumberFormat.getInstance().format(discountValue);
    }
}
