package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.Product;
import com.hutech.NguyenNgocDuy.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductApiController {
    private final ProductService productService;

    @GetMapping
    public List<ProductDto> getProducts() {
        return productService.getAllProducts().stream()
                .map(ProductDto::from)
                .toList();
    }

    public record ProductDto(
            Long id,
            String name,
            String image,
            double price,
            Double oldPrice,
            Integer discountPercent,
            String badge,
            String statusText,
            boolean promo,
            Long categoryId,
            String categoryName,
            Integer promoQuantity,
            Integer promoSold,
            int promoRemaining,
            double effectivePrice,
            boolean promoAvailable) {
        public static ProductDto from(Product product) {
            return new ProductDto(
                    product.getId(),
                    product.getName(),
                    product.getImageUrl(),
                    product.getPrice(),
                    product.getOldPrice(),
                    product.getDiscountPercent(),
                    product.getBadge(),
                    product.getStatusText(),
                    product.isPromo(),
                    product.getCategory() != null ? product.getCategory().getId() : null,
                    product.getCategory() != null ? product.getCategory().getName() : null,
                    product.getPromoQuantity(),
                    product.getPromoSold(),
                    product.getPromoRemaining(),
                    product.getEffectivePrice(),
                    product.isPromoAvailable());
        }
    }
}