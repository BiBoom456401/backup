package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.CartItem;
import com.hutech.NguyenNgocDuy.model.Coupon;
import com.hutech.NguyenNgocDuy.model.Customer;
import com.hutech.NguyenNgocDuy.model.Order;
import com.hutech.NguyenNgocDuy.service.CartService;
import com.hutech.NguyenNgocDuy.service.CouponService;
import com.hutech.NguyenNgocDuy.service.OrderService;
import com.hutech.NguyenNgocDuy.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final CartService cartService;
    private final PointService pointService;
    private final CouponService couponService;

    @GetMapping("/checkout")
    public String checkout(@RequestParam(value = "phone", required = false) String phone, Model model) {
        List<CartItem> cartItems = cartService.getCartItems();
        if (cartItems.isEmpty()) {
            return "redirect:/cart";
        }

        double total = cartService.getTotal();
        model.addAttribute("cartItems", cartItems);
        model.addAttribute("total", total);
        model.addAttribute("totalFormatted", cartService.getTotalFormatted());
        model.addAttribute("earnedPoints", pointService.calculateEarnedPoints(total));
        model.addAttribute("shippingFee", cartService.getShippingFee());
        model.addAttribute("shippingFeeFormatted", cartService.getShippingFeeFormatted());
        model.addAttribute("order", new Order());

        if (phone != null && !phone.isBlank()) {
            Customer customer = pointService.getCustomerByPhone(phone);
            if (customer != null) {
                model.addAttribute("customer", customer);
            }
        }

        return "cart/checkout";
    }

    @PostMapping("/submit")
    public String submitOrder(@ModelAttribute Order order,
            @RequestParam(value = "pointsToUse", defaultValue = "0") int pointsToUse,
            @RequestParam(value = "couponCode", required = false) String couponCode,
            RedirectAttributes redirectAttributes) {
        List<CartItem> cartItems = cartService.getCartItems();
        if (cartItems.isEmpty()) {
            return "redirect:/cart";
        }

        Order savedOrder = orderService.createOrder(order, cartItems, pointsToUse, couponCode);
        redirectAttributes.addAttribute("orderId", savedOrder.getId());
        return "redirect:/order/confirmation";
    }

    @GetMapping("/confirmation")
    public String orderConfirmation(@RequestParam("orderId") Long orderId, Model model) {
        Order order = orderService.getOrderById(orderId).orElse(null);
        if (order == null) {
            return "redirect:/";
        }
        model.addAttribute("order", order);
        return "cart/order-confirmation";
    }

    @GetMapping("/api/points")
    @ResponseBody
    public CustomerPointsResponse getPointsByPhone(@RequestParam("phone") String phone) {
        Customer customer = pointService.getCustomerByPhone(phone);
        if (customer == null) {
            return new CustomerPointsResponse(false, "", 0, "", "");
        }
        return new CustomerPointsResponse(true, customer.getName(), customer.getPoints(), customer.getEmail(),
                customer.getAddress());
    }

    @GetMapping("/api/available-coupons")
    @ResponseBody
    public AvailableCouponsResponse getAvailableCoupons(@RequestParam("phone") String phone) {
        List<Coupon> personal = couponService.getValidCouponsByPhone(phone);
        List<Coupon> publicCoupons = couponService.getPublicCoupons();
        List<CouponDto> personalDtos = personal.stream()
                .map(c -> new CouponDto(c.getCode(), c.getDiscountFormatted(), c.getDiscountValue(),
                        c.getExpiresAt().toString(), "personal"))
                .toList();
        List<CouponDto> publicDtos = publicCoupons.stream()
                .map(c -> new CouponDto(c.getCode(), c.getDiscountFormatted(), c.getDiscountValue(),
                        c.getExpiresAt().toString(), "public"))
                .toList();
        return new AvailableCouponsResponse(personalDtos, publicDtos);
    }

    public record CustomerPointsResponse(boolean found, String name, int points, String email, String address) {
    }

    public record CouponDto(String code, String discountFormatted, double discountValue, String expiresAt,
            String type) {
    }

    public record AvailableCouponsResponse(List<CouponDto> personal, List<CouponDto> publicCoupons) {
    }
}