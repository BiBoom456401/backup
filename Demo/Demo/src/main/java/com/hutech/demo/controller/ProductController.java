package com.hutech.demo.controller;

import com.hutech.demo.model.Category;
import com.hutech.demo.model.Product;
import com.hutech.demo.service.CategoryService;
import com.hutech.demo.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    // Display list of products
    @GetMapping
    public String showProductList(Model model) {
        model.addAttribute("products", productService.getAllProducts());
        return "products/product-list";
    }

    // Show add product form
    @GetMapping("/add")
    public String showAddForm(Model model) {
        Product product = new Product();
        product.setCategory(new Category());
        model.addAttribute("product", product);
        model.addAttribute("categories", categoryService.getAllCategories());
        return "products/add-product";
    }

    // Handle add product
    @PostMapping("/add")
    public String addProduct(
            @Valid Product product,
            BindingResult result,
            Model model
    ) {
        if (result.hasErrors()) {
            model.addAttribute("categories", categoryService.getAllCategories());
            return "products/add-product";
        }

        applyCategory(product);
        productService.addProduct(product);
        return "redirect:/products";
    }

    // Show edit product form
    @GetMapping("/edit/{id}")
    public String showEditForm(
            @PathVariable("id") Long id,
            Model model
    ) {
        Product product = productService.getProductById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid product Id: " + id
                        )
                );

        model.addAttribute("product", product);
        model.addAttribute("categories", categoryService.getAllCategories());

        return "products/update-product";
    }

    // Handle update product
    @PostMapping("/update/{id}")
    public String updateProduct(
            @PathVariable("id") Long id,
            @Valid Product product,
            BindingResult result,
            Model model
    ) {
        if (result.hasErrors()) {
            product.setId(id);
            model.addAttribute("categories", categoryService.getAllCategories());
            return "products/update-product";
        }

        applyCategory(product);
        productService.updateProduct(product);
        return "redirect:/products";
    }

    // Handle delete product
    @GetMapping("/delete/{id}")
    public String deleteProduct(
            @PathVariable("id") Long id
    ) {
        productService.deleteProductById(id);
        return "redirect:/products";
    }

    private void applyCategory(Product product) {
        if (product.getCategory() == null || product.getCategory().getId() == null) {
            product.setCategory(null);
            return;
        }

        Long categoryId = product.getCategory().getId();
        product.setCategory(
                categoryService.getCategoryById(categoryId)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid category Id: " + categoryId))
        );
    }
}
