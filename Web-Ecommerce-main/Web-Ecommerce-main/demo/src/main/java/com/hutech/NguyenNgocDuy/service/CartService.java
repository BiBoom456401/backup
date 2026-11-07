package com.hutech.NguyenNgocDuy.service;

import com.hutech.NguyenNgocDuy.model.CartItem;
import com.hutech.NguyenNgocDuy.model.Product;
import com.hutech.NguyenNgocDuy.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.SessionScope;

import java.util.ArrayList;
import java.util.List;

@Service
@SessionScope
@RequiredArgsConstructor
public class CartService {
    private final ProductRepository productRepository;

    private final List<CartItem> cartItems = new ArrayList<>();

    public void addToCart(Long productId, int quantity) {
        if (quantity <= 0) {
            return;
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại: " + productId));

        int currentInCart = 0;
        for (CartItem item : cartItems) {
            if (item.getProduct().getId().equals(productId)) {
                currentInCart = item.getQuantity();
                break;
            }
        }

        int maxAllowed = quantity;
        if (product.isPromo() && product.getPromoQuantity() != null && product.getPromoQuantity() > 0) {
            int remaining = product.getPromoRemaining();
            if (remaining > 0) {
                maxAllowed = Math.min(quantity, remaining - currentInCart);
                if (maxAllowed <= 0) {
                    return;
                }
            }
            // remaining == 0: promo sold out, sell at original price with no limit
        }

        for (CartItem item : cartItems) {
            if (item.getProduct().getId().equals(productId)) {
                item.setQuantity(item.getQuantity() + maxAllowed);
                return;
            }
        }

        cartItems.add(new CartItem(product, maxAllowed));
    }

    public void updateQuantity(Long productId, int quantity) {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        for (CartItem item : cartItems) {
            if (item.getProduct().getId().equals(productId)) {
                Product product = item.getProduct();
                if (product.isPromo() && product.getPromoQuantity() != null && product.getPromoQuantity() > 0) {
                    int remaining = product.getPromoRemaining();
                    if (remaining > 0) {
                        quantity = Math.min(quantity, remaining);
                    }
                    // remaining == 0: promo sold out, no limit
                }
                item.setQuantity(Math.max(1, quantity));
                return;
            }
        }
    }

    public List<CartItem> getCartItems() {
        // Refresh products from DB to get latest promo data
        for (CartItem item : cartItems) {
            productRepository.findById(item.getProduct().getId()).ifPresent(item::setProduct);
        }
        return cartItems;
    }

    public void removeFromCart(Long productId) {
        cartItems.removeIf(item -> item.getProduct().getId().equals(productId));
    }

    public void clearCart() {
        cartItems.clear();
    }

    public double getTotal() {
        return cartItems.stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
    }

    public int getItemCount() {
        return cartItems.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    public String getTotalFormatted() {
        return java.text.NumberFormat.getInstance().format(getTotal());
    }

    public double getShippingFee() {
        double total = getTotal();
        int itemCount = getItemCount();
        if (total >= 1000000 && itemCount >= 2) {
            return 0;
        }
        return 30000;
    }

    public String getShippingFeeFormatted() {
        double fee = getShippingFee();
        if (fee == 0)
            return "Miễn phí";
        return java.text.NumberFormat.getInstance().format(fee) + "₫";
    }
}