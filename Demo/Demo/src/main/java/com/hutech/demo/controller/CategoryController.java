package com.hutech.demo.controller;

import com.hutech.demo.model.Category;
import com.hutech.demo.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class CategoryController {

    @Autowired
    private final CategoryService categoryService;

    @GetMapping("/categories/add")
    public String showAddForm(Model model) {
        model.addAttribute("category", new Category());
        model.addAttribute("categories", categoryService.getAllCategories());
        return "categories/add-category";
    }

    @PostMapping("/categories/add")
    public String addCategory(@Valid Category category, BindingResult result) {
        if (result.hasErrors()) {
            return "categories/add-category";
        }
        categoryService.addCategory(category);
        return "redirect:/categories";
    }

    // Hiển thị danh sách danh mục
    @GetMapping("/categories")
    public String listCategories(Model model) {
        List<Category> categories = categoryService.getAllCategories();
        model.addAttribute("categories", categories);
        model.addAttribute("categoryMap", categories.stream()
                .collect(java.util.stream.Collectors.toMap(Category::getId, Category::getName)));
        return "categories/categories-list";
    }
    // GET request to show category edit form
    @GetMapping("/categories/edit/{id}")
    public String showUpdateForm(@PathVariable("id") Long id, Model model) {

        Category category = categoryService.getCategoryById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid category Id: " + id)
                );

        model.addAttribute("category", category);
        model.addAttribute("categories", categoryService.getAllCategories().stream()
                .filter(cat -> !cat.getId().equals(id))
                .toList());
        return "categories/update-category";
    }

    // POST request to update category
    @PostMapping("/categories/update/{id}")
    public String updateCategory(
            @PathVariable("id") Long id,
            @Valid Category category,
            BindingResult result,
            Model model
    ) {

        if (result.hasErrors()) {
            category.setId(id);
            model.addAttribute("categories", categoryService.getAllCategories().stream()
                    .filter(cat -> !cat.getId().equals(id))
                    .toList());
            return "categories/update-category";
        }

        categoryService.updateCategory(category);
        return "redirect:/categories";
    }

    // GET request for deleting category
    @GetMapping("/categories/delete/{id}")
    public String deleteCategory(@PathVariable("id") Long id) {

        Category category = categoryService.getCategoryById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid category Id: " + id)
                );

        categoryService.deleteCategoryById(id);
        return "redirect:/categories";
    }

}
