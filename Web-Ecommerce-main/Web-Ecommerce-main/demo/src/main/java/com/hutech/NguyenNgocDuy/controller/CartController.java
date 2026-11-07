package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.service.CartService;
import com.hutech.NguyenNgocDuy.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;
    private final PointService pointService;

    @GetMapping
    public String showCart(Model model) {
        double total = cartService.getTotal();
        model.addAttribute("cartItems", cartService.getCartItems());
        model.addAttribute("total", total);
        model.addAttribute("totalFormatted", cartService.getTotalFormatted());
        model.addAttribute("itemCount", cartService.getItemCount());
        model.addAttribute("earnedPoints", pointService.calculateEarnedPoints(total));
        model.addAttribute("shippingFee", cartService.getShippingFee());
        model.addAttribute("shippingFeeFormatted", cartService.getShippingFeeFormatted());
        return "cart/cart";
    }

    @PostMapping("/add")
    public String addToCart(@RequestParam("productId") Long productId,
            @RequestParam(value = "quantity", defaultValue = "1") int quantity,
            @RequestParam(value = "redirect", required = false) String redirect) {
        cartService.addToCart(productId, quantity);
        if (redirect != null && !redirect.isBlank()) {
            return "redirect:" + redirect;
        }
        return "redirect:/cart";
    }

    @PostMapping("/update")
    public String updateQuantity(@RequestParam("productId") Long productId, @RequestParam("quantity") int quantity) {
        cartService.updateQuantity(productId, quantity);
        return "redirect:/cart";
    }

    @GetMapping("/remove/{productId}")
    public String removeFromCart(@PathVariable("productId") Long productId) {
        cartService.removeFromCart(productId);
        return "redirect:/cart";
    }

    @GetMapping("/clear")
    public String clearCart() {
        cartService.clearCart();
        return "redirect:/cart";
    }
}