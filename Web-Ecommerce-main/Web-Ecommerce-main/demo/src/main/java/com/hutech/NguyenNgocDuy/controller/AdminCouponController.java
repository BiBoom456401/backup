package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {
    private final CouponService couponService;

    @GetMapping
    public String couponPage(Model model) {
        model.addAttribute("coupons", couponService.getAllCoupons());
        return "admin/coupons";
    }

    @PostMapping("/create")
    public String createCoupon(@RequestParam(value = "code", required = false) String code,
            @RequestParam("discountValue") double discountValue,
            @RequestParam(value = "validityDays", defaultValue = "30") int validityDays,
            RedirectAttributes redirectAttributes) {
        try {
            var coupon = couponService.createAdminCoupon(code, discountValue, validityDays);
            redirectAttributes.addFlashAttribute("success", "Tạo mã thành công: " + coupon.getCode());
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/coupons";
    }

    @PostMapping("/delete")
    public String deleteCoupon(@RequestParam("id") Long id, RedirectAttributes redirectAttributes) {
        couponService.deleteCoupon(id);
        redirectAttributes.addFlashAttribute("success", "Đã xóa mã khuyến mãi.");
        return "redirect:/admin/coupons";
    }
}
