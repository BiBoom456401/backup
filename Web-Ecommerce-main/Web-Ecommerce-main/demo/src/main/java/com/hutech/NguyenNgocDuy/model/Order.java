package com.hutech.NguyenNgocDuy.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    private String phone;

    private String email;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String note;

    private LocalDateTime orderDate;

    private double totalAmount;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "points_used")
    private Integer pointsUsed = 0;

    @Column(name = "points_earned")
    private Integer pointsEarned = 0;

    @Column(name = "discount_amount")
    private double discountAmount = 0;

    @Column(name = "shipping_fee")
    private double shippingFee = 0;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "payment_method")
    private String paymentMethod = "COD";

    @Column(name = "payment_status")
    private String paymentStatus = "PENDING";

    @PrePersist
    protected void onCreate() {
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
        }
    }

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;

    public String getTotalFormatted() {
        return java.text.NumberFormat.getInstance().format(totalAmount);
    }

    public String getDiscountFormatted() {
        return java.text.NumberFormat.getInstance().format(discountAmount);
    }

    public double getFinalAmount() {
        return Math.max(0, totalAmount - discountAmount + shippingFee);
    }

    public String getFinalAmountFormatted() {
        return java.text.NumberFormat.getInstance().format(getFinalAmount());
    }

    public String getShippingFeeFormatted() {
        return java.text.NumberFormat.getInstance().format(shippingFee);
    }
}