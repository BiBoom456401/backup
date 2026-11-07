package com.hutech.demo.controller;

import com.hutech.demo.model.Product;
import com.hutech.demo.service.ProductService;
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
            boolean promo
    ) {
        public static ProductDto from(Product product) {
            return new ProductDto(
                    product.getId(),
                    product.getName(),
                    product.getImage(),
                    product.getPrice(),
                    product.getOldPrice(),
                    product.getDiscountPercent(),
                    product.getBadge(),
                    product.getStatusText(),
                    product.isPromo()
            );
        }
    }
}
