package com.hutech.NguyenNgocDuy.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    private Product product;
    private int quantity;

    public double getSubtotal() {
        return product.getEffectivePrice() * quantity;
    }

    public String getSubtotalDisplay() {
        return java.text.NumberFormat.getInstance().format(getSubtotal());
    }
}