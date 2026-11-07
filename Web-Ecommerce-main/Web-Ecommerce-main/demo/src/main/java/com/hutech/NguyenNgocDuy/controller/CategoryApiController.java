package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.model.Category;
import com.hutech.NguyenNgocDuy.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryApiController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryDto> getCategories() {
        return categoryService.getAllCategories().stream()
                .map(CategoryDto::from)
                .toList();
    }

    public record CategoryDto(Long id, String name, String iconUrl, Long parentId) {
        public static CategoryDto from(Category category) {
            return new CategoryDto(category.getId(), category.getName(), category.getIconUrl(), category.getParentId());
        }
    }
}