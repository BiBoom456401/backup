package com.hutech.NguyenNgocDuy.repository;

import com.hutech.NguyenNgocDuy.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}