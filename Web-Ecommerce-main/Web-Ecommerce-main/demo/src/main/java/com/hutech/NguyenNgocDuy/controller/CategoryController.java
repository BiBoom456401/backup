package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.Category;
import com.hutech.NguyenNgocDuy.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public String listCategories(Model model) {
        List<Category> categories = categoryService.getAllCategories();
        model.addAttribute("categories", categories);
        return "categories/categories-list";
    }

    @GetMapping("/add")
    public String showAddForm(Model model) {
        model.addAttribute("category", new Category());
        model.addAttribute("pageTitle", "Thêm danh mục mới");
        model.addAttribute("formAction", "/categories/add");
        return "categories/add-category";
    }

    @PostMapping("/add")
    public String addCategory(@Valid Category category, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("pageTitle", "Thêm danh mục mới");
            model.addAttribute("formAction", "/categories/add");
            return "categories/add-category";
        }
        categoryService.addCategory(category);
        return "redirect:/categories";
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable("id") Long id, Model model) {
        Category category = categoryService.getCategoryById(id)
                .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại: " + id));
        model.addAttribute("category", category);
        model.addAttribute("pageTitle", "Cập nhật danh mục");
        model.addAttribute("formAction", "/categories/update/" + id);
        return "categories/add-category";
    }

    @PostMapping("/update/{id}")
    public String updateCategory(@PathVariable("id") Long id, @Valid Category category, BindingResult result,
            Model model) {
        if (result.hasErrors()) {
            category.setId(id);
            model.addAttribute("pageTitle", "Cập nhật danh mục");
            model.addAttribute("formAction", "/categories/update/" + id);
            return "categories/add-category";
        }
        category.setId(id);
        categoryService.updateCategory(category);
        return "redirect:/categories";
    }

    @GetMapping("/delete/{id}")
    public String deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategoryById(id);
        return "redirect:/categories";
    }
}