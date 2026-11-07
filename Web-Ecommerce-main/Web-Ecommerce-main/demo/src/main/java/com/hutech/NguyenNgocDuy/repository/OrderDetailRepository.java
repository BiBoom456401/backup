package com.hutech.NguyenNgocDuy.repository;

import com.hutech.NguyenNgocDuy.model.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
}