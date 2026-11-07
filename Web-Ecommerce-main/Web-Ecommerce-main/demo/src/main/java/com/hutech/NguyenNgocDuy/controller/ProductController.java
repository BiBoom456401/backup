package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.Category;
import com.hutech.NguyenNgocDuy.model.Product;
import com.hutech.NguyenNgocDuy.service.CategoryService;
import com.hutech.NguyenNgocDuy.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final CategoryService categoryService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping
    public String listProducts(@RequestParam(value = "category", required = false) Long category,
            @RequestParam(value = "q", required = false) String q,
            Model model) {
        List<Product> products;
        if (category != null) {
            products = productService.getProductsByCategory(category);
            model.addAttribute("selectedCategory", category);
        } else if (q != null && !q.isBlank()) {
            products = productService.searchProducts(q);
            model.addAttribute("keyword", q);
        } else {
            products = productService.getAllProducts();
        }
        model.addAttribute("products", products);
        model.addAttribute("categories", categoryService.getAllCategories());
        return "product/product-list";
    }

    @GetMapping("/category/{categoryId}")
    public String showProductsByCategory(@PathVariable("categoryId") Long categoryId, Model model) {
        Category category = categoryService.getCategoryById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại: " + categoryId));
        model.addAttribute("category", category);
        model.addAttribute("products", productService.getProductsByCategory(categoryId));
        return "product/products-by-category";
    }

    @GetMapping("/add")
    public String showAddForm(Model model) {
        Product product = new Product();
        product.setCategory(new Category());
        model.addAttribute("product", product);
        model.addAttribute("categories", categoryService.getAllCategories());
        return "product/add-product";
    }

    @PostMapping("/add")
    public String addProduct(@Valid Product product,
            BindingResult result,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            Model model) {
        if (result.hasErrors()) {
            model.addAttribute("categories", categoryService.getAllCategories());
            return "product/add-product";
        }

        assignCategory(product);
        applyImage(product, imageFile, null);
        productService.addProduct(product);
        return "redirect:/products";
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable("id") Long id, Model model) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại: " + id));
        if (product.getCategory() == null) {
            product.setCategory(new Category());
        }
        model.addAttribute("product", product);
        model.addAttribute("categories", categoryService.getAllCategories());
        return "product/update-product";
    }

    @PostMapping("/update/{id}")
    public String updateProduct(@PathVariable("id") Long id,
            @Valid Product product,
            BindingResult result,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            Model model) {
        Product existingProduct = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại: " + id));

        if (result.hasErrors()) {
            product.setId(id);
            model.addAttribute("categories", categoryService.getAllCategories());
            return "product/update-product";
        }

        product.setId(id);
        assignCategory(product);
        applyImage(product, imageFile, existingProduct.getImageUrl());
        productService.updateProduct(product);
        return "redirect:/products";
    }

    @GetMapping("/delete/{id}")
    public String deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return "redirect:/products";
    }

    private void assignCategory(Product product) {
        if (product.getCategory() == null || product.getCategory().getId() == null) {
            product.setCategory(null);
            return;
        }
        Category category = categoryService.getCategoryById(product.getCategory().getId())
                .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại"));
        product.setCategory(category);
    }

    private void applyImage(Product product, MultipartFile imageFile, String existingImageUrl) {
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                product.setImageUrl(saveImage(imageFile));
            } catch (IOException e) {
                throw new IllegalStateException("Không thể tải ảnh lên", e);
            }
            return;
        }
        product.setImageUrl(existingImageUrl);
    }

    private String saveImage(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get("src/main/resources/static").resolve(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = StringUtils.getFilenameExtension(originalFilename);
        String newFilename = UUID.randomUUID() + (fileExtension == null ? "" : "." + fileExtension);

        Path filePath = uploadPath.resolve(newFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/" + uploadDir + "/" + newFilename;
    }
}