package com.hutech.demo.service;

import com.hutech.demo.model.Product;
import com.hutech.demo.repository.ProductRepository;
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

    // Retrieve all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Retrieve product by id
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    // Add new product
    public Product addProduct(Product product) {
        return productRepository.save(product);
    }

    // Update existing product
    public Product updateProduct(@NotNull Product product) {

        Product existingProduct = productRepository.findById(product.getId())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Product with ID " + product.getId() + " does not exist."
                        )
                );

        existingProduct.setName(product.getName());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setOldPrice(product.getOldPrice());
        existingProduct.setDiscountPercent(product.getDiscountPercent());
        existingProduct.setBadge(product.getBadge());
        existingProduct.setStatusText(product.getStatusText());
        existingProduct.setPromo(product.isPromo());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setImage(product.getImage());
        existingProduct.setCategory(product.getCategory());

        return productRepository.save(existingProduct);
    }

    // Delete product by id
    public void deleteProductById(Long id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalStateException(
                    "Product with ID " + id + " does not exist."
            );
        }
        productRepository.deleteById(id);
    }
}
