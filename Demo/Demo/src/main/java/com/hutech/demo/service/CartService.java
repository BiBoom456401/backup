package com.hutech.demo.service;

import com.hutech.demo.model.CartItem;
import com.hutech.demo.model.Product;
import com.hutech.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.SessionScope;

import java.util.ArrayList;
import java.util.List;

@Service
@SessionScope
public class CartService {

    private List<CartItem> cartItems = new ArrayList<>();

    @Autowired
    private ProductRepository productRepository;

    public void addToCart(Long productId, int quantity) {

        // kiểm tra sản phẩm đã có trong giỏ chưa
        for (CartItem item : cartItems) {

            if (item.getProduct().getId().equals(productId)) {

                // nếu có thì tăng số lượng
                item.setQuantity(item.getQuantity() + quantity);
                return;
            }
        }

        // nếu chưa có thì thêm mới
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        cartItems.add(new CartItem(product, quantity));
    }

    public List<CartItem> getCartItems() {
        return cartItems;
    }

    public void removeFromCart(Long productId) {

        // chỉ xóa đúng 1 dòng sản phẩm
        cartItems.removeIf(item -> item.getProduct().getId().equals(productId));

    }

    public void clearCart() {
        cartItems.clear();
    }
}