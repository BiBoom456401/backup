package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.Coupon;
import com.hutech.NguyenNgocDuy.model.Customer;
import com.hutech.NguyenNgocDuy.service.CouponService;
import com.hutech.NguyenNgocDuy.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@RequestMapping("/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {
    private final PointService pointService;
    private final CouponService couponService;

    @GetMapping
    public String loyaltyPage(Model model) {
        model.addAttribute("tiers", couponService.getTiers());
        return "loyalty/loyalty";
    }

    @GetMapping("/api/lookup")
    @ResponseBody
    public LoyaltyLookupResponse lookup(@RequestParam("phone") String phone) {
        Customer customer = pointService.getCustomerByPhone(phone);
        if (customer == null) {
            return new LoyaltyLookupResponse(false, null, 0, 0, 0, List.of());
        }
        List<Coupon> coupons = couponService.getCouponsByPhone(phone);
        List<CouponInfo> couponInfos = coupons.stream()
                .map(c -> new CouponInfo(c.getCode(), c.getDiscountFormatted(), c.isUsed(), c.isValid(),
                        c.getExpiresAt().toString()))
                .toList();
        return new LoyaltyLookupResponse(true, customer.getName(), customer.getPoints(),
                customer.getTotalSpent(), customer.getOrderCount(), couponInfos);
    }

    @PostMapping("/api/redeem")
    @ResponseBody
    public RedeemResponse redeem(@RequestParam("phone") String phone,
            @RequestParam(value = "tierIndex", defaultValue = "0") int tierIndex) {
        try {
            Coupon coupon = couponService.redeemCoupon(phone, tierIndex);
            return new RedeemResponse(true, coupon.getCode(), coupon.getDiscountFormatted(),
                    coupon.getExpiresAt().toString(), null);
        } catch (IllegalArgumentException e) {
            return new RedeemResponse(false, null, null, null, e.getMessage());
        }
    }

    @GetMapping("/api/validate-coupon")
    @ResponseBody
    public CouponValidateResponse validateCoupon(@RequestParam("code") String code) {
        Coupon coupon = couponService.validateCoupon(code);
        if (coupon == null) {
            return new CouponValidateResponse(false, 0, null);
        }
        return new CouponValidateResponse(true, coupon.getDiscountValue(), coupon.getDiscountFormatted());
    }

    @GetMapping("/api/public-coupons")
    @ResponseBody
    public List<CouponInfo> getPublicCoupons() {
        return couponService.getPublicCoupons().stream()
                .map(c -> new CouponInfo(c.getCode(), c.getDiscountFormatted(), c.isUsed(), c.isValid(),
                        c.getExpiresAt().toString()))
                .toList();
    }

    public record LoyaltyLookupResponse(boolean found, String name, int points, double totalSpent,
            int orderCount, List<CouponInfo> coupons) {
    }

    public record CouponInfo(String code, String discountFormatted, boolean used, boolean valid, String expiresAt) {
    }

    public record RedeemResponse(boolean success, String code, String discountFormatted, String expiresAt,
            String error) {
    }

    public record CouponValidateResponse(boolean valid, double discountValue, String discountFormatted) {
    }
}
