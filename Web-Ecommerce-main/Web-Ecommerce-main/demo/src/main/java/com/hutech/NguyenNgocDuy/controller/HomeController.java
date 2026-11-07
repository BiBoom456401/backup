package com.hutech.NguyenNgocDuy.controller;

import com.hutech.NguyenNgocDuy.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {
    private final ProductService productService;

    @GetMapping("/")
    public String hello(Model model) {
        model.addAttribute("promoProducts", productService.getPromoProducts());
        model.addAttribute("normalProducts", productService.getNormalProducts());
        model.addAttribute("products", productService.getAllProducts());
        return "home/home";
    }
}