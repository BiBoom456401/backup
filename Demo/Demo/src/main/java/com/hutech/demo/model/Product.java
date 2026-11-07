package com.hutech.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private double price;

    private Double oldPrice;

    private Integer discountPercent;

    private String badge;

    private String statusText;

    private boolean promo;

    private String description;

    private String image;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    public String getPriceDisplay() {
        return java.text.NumberFormat.getInstance().format(price);
    }

    public String getOldPriceDisplay() {
        if (oldPrice == null) {
            return null;
        }
        return java.text.NumberFormat.getInstance().format(oldPrice);
    }
}
