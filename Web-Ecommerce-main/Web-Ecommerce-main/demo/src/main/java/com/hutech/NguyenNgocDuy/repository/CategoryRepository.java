package com.hutech.NguyenNgocDuy.repository; // Phải khớp với thư mục

import com.hutech.NguyenNgocDuy.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}