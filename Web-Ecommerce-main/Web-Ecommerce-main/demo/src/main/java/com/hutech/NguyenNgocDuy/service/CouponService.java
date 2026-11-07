package com.hutech.NguyenNgocDuy.service;

import com.hutech.NguyenNgocDuy.model.Coupon;
import com.hutech.NguyenNgocDuy.model.Customer;
import com.hutech.NguyenNgocDuy.repository.CouponRepository;
import com.hutech.NguyenNgocDuy.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class CouponService {

    public record RedeemTier(int points, double discount, String label) {
    }

    private static final List<RedeemTier> TIERS = List.of(
            new RedeemTier(10, 10000, "10 điểm → Giảm 10,000₫"),
            new RedeemTier(30, 50000, "30 điểm → Giảm 50,000₫"),
            new RedeemTier(50, 100000, "50 điểm → Giảm 100,000₫"),
            new RedeemTier(100, 250000, "100 điểm → Giảm 250,000₫"));

    private static final int COUPON_VALIDITY_DAYS = 30;

    private final CouponRepository couponRepository;
    private final CustomerRepository customerRepository;

    public List<RedeemTier> getTiers() {
        return TIERS;
    }

    public Coupon redeemCoupon(String phone, int tierIndex) {
        if (tierIndex < 0 || tierIndex >= TIERS.size()) {
            throw new IllegalArgumentException("Gói đổi điểm không hợp lệ.");
        }
        RedeemTier tier = TIERS.get(tierIndex);

        Customer customer = customerRepository.findByPhone(phone.trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách hàng với SĐT: " + phone));

        if (customer.getPoints() < tier.points()) {
            throw new IllegalArgumentException("Không đủ điểm. Cần tối thiểu " + tier.points() + " điểm.");
        }

        customer.setPoints(customer.getPoints() - tier.points());
        customerRepository.save(customer);

        Coupon coupon = new Coupon();
        coupon.setCode(generateCode());
        coupon.setDiscountValue(tier.discount());
        coupon.setPointsCost(tier.points());
        coupon.setUsed(false);
        coupon.setCreatedAt(LocalDateTime.now());
        coupon.setExpiresAt(LocalDateTime.now().plusDays(COUPON_VALIDITY_DAYS));
        coupon.setCustomer(customer);

        return couponRepository.save(coupon);
    }

    public Coupon validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code.trim().toUpperCase())
                .orElse(null);
        if (coupon == null || !coupon.isValid()) {
            return null;
        }
        return coupon;
    }

    public void useCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Mã khuyến mãi không tồn tại"));
        coupon.setUsed(true);
        couponRepository.save(coupon);
    }

    public List<Coupon> getCouponsByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone.trim()).orElse(null);
        if (customer == null) {
            return List.of();
        }
        return couponRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Coupon> getPublicCoupons() {
        return couponRepository
                .findByCustomerIsNullAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now());
    }

    public List<Coupon> getValidCouponsByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone.trim()).orElse(null);
        if (customer == null)
            return List.of();
        return couponRepository.findByCustomerAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(customer,
                LocalDateTime.now());
    }

    public Coupon createAdminCoupon(String code, double discountValue, int validityDays) {
        if (code == null || code.isBlank()) {
            code = generateCode();
        } else {
            code = code.trim().toUpperCase();
        }
        if (couponRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("Mã '" + code + "' đã tồn tại.");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountValue(discountValue);
        coupon.setPointsCost(0);
        coupon.setUsed(false);
        coupon.setCreatedAt(LocalDateTime.now());
        coupon.setExpiresAt(LocalDateTime.now().plusDays(validityDays > 0 ? validityDays : COUPON_VALIDITY_DAYS));
        coupon.setCustomer(null);
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }

    public int getPointsPerCoupon() {
        return TIERS.get(0).points();
    }

    public double getDiscountPerCoupon() {
        return TIERS.get(0).discount();
    }

    private String generateCode() {
        return "KM" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
