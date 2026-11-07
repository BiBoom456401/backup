package com.hutech.NguyenNgocDuy.service;

import com.hutech.NguyenNgocDuy.model.Product;
import com.hutech.NguyenNgocDuy.repository.ProductRepository;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product addProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(@NotNull Product product) {
        Product existingProduct = productRepository.findById(product.getId())
                .orElseThrow(
                        () -> new IllegalStateException("Product with ID " + product.getId() + " does not exist."));

        existingProduct.setName(product.getName());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setOldPrice(product.getOldPrice());
        existingProduct.setDiscountPercent(product.getDiscountPercent());
        existingProduct.setBadge(product.getBadge());
        existingProduct.setStatusText(product.getStatusText());
        existingProduct.setPromo(product.isPromo());
        existingProduct.setPromoQuantity(product.getPromoQuantity());
        existingProduct.setPromoSold(product.getPromoSold());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setImageUrl(product.getImageUrl());
        existingProduct.setCategory(product.getCategory());
        return productRepository.save(existingProduct);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> getPromoProducts() {
        return productRepository.findByPromoTrue();
    }

    public List<Product> getNormalProducts() {
        return productRepository.findByPromoFalse();
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> searchProducts(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAllProducts();
        }
        return productRepository.findByNameContainingIgnoreCase(keyword.trim());
    }
}
