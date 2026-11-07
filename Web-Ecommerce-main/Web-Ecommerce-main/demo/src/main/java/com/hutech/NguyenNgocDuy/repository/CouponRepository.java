package com.hutech.NguyenNgocDuy.repository;

import com.hutech.NguyenNgocDuy.model.Coupon;
import com.hutech.NguyenNgocDuy.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);

    List<Coupon> findByCustomerOrderByCreatedAtDesc(Customer customer);

    List<Coupon> findAllByOrderByCreatedAtDesc();

    List<Coupon> findByCustomerIsNullAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);

    List<Coupon> findByCustomerAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(Customer customer, LocalDateTime now);
}
