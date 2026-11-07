package com.hutech.NguyenNgocDuy.service;

import com.hutech.NguyenNgocDuy.model.CartItem;
import com.hutech.NguyenNgocDuy.model.Coupon;
import com.hutech.NguyenNgocDuy.model.Customer;
import com.hutech.NguyenNgocDuy.model.Order;
import com.hutech.NguyenNgocDuy.model.OrderDetail;
import com.hutech.NguyenNgocDuy.repository.OrderDetailRepository;
import com.hutech.NguyenNgocDuy.repository.OrderRepository;
import com.hutech.NguyenNgocDuy.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final PointService pointService;
    private final CouponService couponService;

    public Order createOrder(Order order, List<CartItem> cartItems, int pointsToUse, String couponCode) {
        double totalAmount = cartItems.stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
        order.setTotalAmount(totalAmount);

        int totalQty = cartItems.stream().mapToInt(CartItem::getQuantity).sum();
        double shippingFee = (totalAmount >= 1000000 && totalQty >= 2) ? 0 : 30000;
        order.setShippingFee(shippingFee);

        Customer customer = pointService.findOrCreateCustomer(
                order.getCustomerName(),
                order.getPhone(),
                order.getEmail(),
                order.getAddress());
        order.setCustomer(customer);

        int actualPointsUsed = 0;
        double discountAmount = 0;
        if (customer != null && pointsToUse > 0) {
            actualPointsUsed = Math.min(pointsToUse, customer.getPoints());
            discountAmount = Math.min(totalAmount, pointService.calculateDiscountFromPoints(actualPointsUsed));
            pointService.usePoints(customer, actualPointsUsed);
        }

        if (couponCode != null && !couponCode.isBlank()) {
            Coupon coupon = couponService.validateCoupon(couponCode);
            if (coupon != null) {
                discountAmount += coupon.getDiscountValue();
                discountAmount = Math.min(discountAmount, totalAmount);
                couponService.useCoupon(couponCode);
                order.setCouponCode(couponCode.trim().toUpperCase());
            }
        }

        order.setPointsUsed(actualPointsUsed);
        order.setDiscountAmount(discountAmount);

        int earnedPoints = pointService.calculateEarnedPoints(Math.max(0, totalAmount - discountAmount));
        order.setPointsEarned(earnedPoints);

        Order savedOrder = orderRepository.save(order);
        List<OrderDetail> details = new ArrayList<>();

        for (CartItem item : cartItems) {
            OrderDetail detail = new OrderDetail();
            detail.setOrder(savedOrder);
            detail.setProduct(item.getProduct());
            detail.setQuantity(item.getQuantity());
            details.add(orderDetailRepository.save(detail));
        }

        savedOrder.setOrderDetails(details);

        for (CartItem item : cartItems) {
            var product = item.getProduct();
            if (product.isPromo() && product.getPromoQuantity() != null && product.getPromoQuantity() > 0) {
                int currentSold = product.getPromoSold() == null ? 0 : product.getPromoSold();
                int remaining = product.getPromoQuantity() - currentSold;
                if (remaining > 0) {
                    int promoUnits = Math.min(item.getQuantity(), remaining);
                    product.setPromoSold(currentSold + promoUnits);
                    productRepository.save(product);
                }
            }
        }

        if (customer != null && earnedPoints > 0) {
            pointService.addPoints(customer, earnedPoints, savedOrder.getFinalAmount());
        }

        cartService.clearCart();
        return savedOrder;
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }
}