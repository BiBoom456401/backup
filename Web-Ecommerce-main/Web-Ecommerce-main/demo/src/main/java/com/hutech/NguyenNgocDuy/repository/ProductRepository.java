package com.hutech.NguyenNgocDuy.repository;

import com.hutech.NguyenNgocDuy.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByPromoTrue();

    List<Product> findByPromoFalse();

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByNameContainingIgnoreCase(String keyword);
}