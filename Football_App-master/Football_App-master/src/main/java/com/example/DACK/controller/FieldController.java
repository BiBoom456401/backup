package com.example.DACK.controller;

import com.example.DACK.dto.BookingRequest;
import com.example.DACK.model.Field;
import com.example.DACK.service.FieldService;
import com.example.DACK.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.IntStream;

@Controller
@RequiredArgsConstructor
public class FieldController {
    private final FieldService fieldService;
    private final FileStorageService fileStorageService;

    @GetMapping("/")
    public String index(Model model, @RequestParam(required = false) String search) {
        if (search != null && !search.isEmpty()) {
            model.addAttribute("fields", fieldService.searchFields(search));
        } else {
            model.addAttribute("fields", fieldService.getAllFields());
        }
        return "index";
    }

    @GetMapping("/fields/{id}")
    public String fieldDetails(@PathVariable Long id, Model model) {
        Field field = fieldService.getFieldById(id).orElse(null);
        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setFieldId(id);
        bookingRequest.setBookingDate(LocalDate.now());
        bookingRequest.setStartTime(LocalTime.of(18, 0));
        bookingRequest.setEndTime(LocalTime.of(19, 0));

        model.addAttribute("field", field);
        model.addAttribute("bookingForm", bookingRequest);
        model.addAttribute("today", LocalDate.now());
        model.addAttribute("bookingDateValue", bookingRequest.getBookingDate().toString());
        return "field_detail";
    }

    // Admin routes
    @GetMapping("/admin/fields")
    public String adminFields(Model model) {
        model.addAttribute("fields", fieldService.getAllFields());
        return "admin/fields";
    }

    @GetMapping("/admin/fields/add")
    public String addFieldForm(Model model) {
        model.addAttribute("field", new Field());
        return "admin/field_form";
    }

    @PostMapping("/admin/fields/save")
    public String saveField(@ModelAttribute Field field,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(imageFile);
            field.setImageUrl(imageUrl);
        }
        fieldService.saveField(field);
        return "redirect:/admin/fields";
    }

    @GetMapping("/admin/fields/edit/{id}")
    public String editFieldForm(@PathVariable Long id, Model model) {
        model.addAttribute("field", fieldService.getFieldById(id).orElse(null));
        return "admin/field_form";
    }

    @GetMapping("/admin/fields/delete/{id}")
    public String deleteField(@PathVariable Long id) {
        fieldService.deleteField(id);
        return "redirect:/admin/fields";
    }

    @ModelAttribute("bookingTimeOptions")
    public List<LocalTime> bookingTimeOptions() {
        return IntStream.rangeClosed(5, 23)
                .mapToObj(hour -> LocalTime.of(hour, 0))
                .toList();
    }
}
