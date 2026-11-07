package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.CartItem;
import com.hutech.NguyenNgocDuy.model.Order;
import com.hutech.NguyenNgocDuy.service.CartService;
import com.hutech.NguyenNgocDuy.service.OrderService;
import com.hutech.NguyenNgocDuy.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final VNPayService vnPayService;
    private final OrderService orderService;
    private final CartService cartService;

    @PostMapping("/vnpay-create")
    public String createVNPayPayment(@ModelAttribute Order order,
            @RequestParam(value = "pointsToUse", defaultValue = "0") int pointsToUse,
            @RequestParam(value = "couponCode", required = false) String couponCode,
            HttpServletRequest request) {
        List<CartItem> cartItems = cartService.getCartItems();
        if (cartItems.isEmpty()) {
            return "redirect:/cart";
        }

        order.setPaymentMethod("VNPAY");
        order.setPaymentStatus("PENDING");
        Order savedOrder = orderService.createOrder(order, cartItems, pointsToUse, couponCode);

        String ipAddress = request.getRemoteAddr();
        if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }

        String paymentUrl = vnPayService.createPaymentUrl(
                savedOrder.getId(),
                savedOrder.getFinalAmount(),
                "Thanh toan don hang #" + savedOrder.getId(),
                ipAddress);

        return "redirect:" + paymentUrl;
    }

    @GetMapping("/vnpay-return")
    public String vnpayReturn(HttpServletRequest request, Model model) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });

        boolean validSignature = vnPayService.validateSignature(params);
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        boolean success = validSignature && "00".equals(responseCode);

        if (txnRef != null) {
            try {
                String orderIdStr = txnRef.contains("_") ? txnRef.substring(0, txnRef.indexOf("_")) : txnRef;
                Long orderId = Long.parseLong(orderIdStr);
                Order order = orderService.getOrderById(orderId).orElse(null);
                if (order != null) {
                    order.setPaymentStatus(success ? "PAID" : "FAILED");
                    orderService.saveOrder(order);
                    model.addAttribute("order", order);
                }
            } catch (NumberFormatException ignored) {
            }
        }

        model.addAttribute("success", success);
        model.addAttribute("responseCode", responseCode);
        return "payment/vnpay-result";
    }
}
