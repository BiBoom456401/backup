package com.example.DACK.controller;

import com.example.DACK.dto.BookingRequest;
import com.example.DACK.dto.BookingSlotResponse;
import com.example.DACK.service.BookingService;
import com.example.DACK.service.FieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final FieldService fieldService;

    @PostMapping("/bookings")
    public String createBooking(@ModelAttribute BookingRequest bookingRequest,
                                @AuthenticationPrincipal UserDetails userDetails,
                                RedirectAttributes redirectAttributes) {
        try {
            bookingService.createBooking(userDetails.getUsername(), bookingRequest);
            redirectAttributes.addFlashAttribute("successMessage", "Đặt sân thành công. Đơn của bạn đang chờ admin duyệt.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/fields/" + bookingRequest.getFieldId();
    }

    @GetMapping("/bookings/my")
    public String myBookings(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        model.addAttribute("bookings", bookingService.getBookingsByUsername(userDetails.getUsername()));
        return "bookings/my_bookings";
    }

    @GetMapping("/admin/bookings")
    public String adminBookings(Model model) {
        model.addAttribute("bookings", bookingService.getAllBookings());
        return "admin/bookings";
    }

    @GetMapping("/admin/bookings/{id}")
    public String adminBookingDetail(@PathVariable Long id, Model model) {
        model.addAttribute("booking", bookingService.getBookingById(id));
        return "admin/booking_detail";
    }

    @GetMapping("/api/fields/{fieldId}/booked-slots")
    @ResponseBody
    public List<BookingSlotResponse> getBookedSlots(@PathVariable Long fieldId, @RequestParam LocalDate date) {
        return bookingService.getBookedSlots(fieldId, date);
    }

    @PostMapping("/admin/bookings/{id}/approve")
    public String approveBooking(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            bookingService.approveBooking(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã duyệt đơn đặt sân.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/bookings";
    }

    @PostMapping("/admin/bookings/{id}/cancel")
    public String cancelBooking(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        bookingService.cancelBooking(id);
        redirectAttributes.addFlashAttribute("successMessage", "Đã hủy đơn đặt sân.");
        return "redirect:/admin/bookings";
    }

    @ModelAttribute("bookingFields")
    public Iterable<com.example.DACK.model.Field> bookingFields() {
        return fieldService.getAllFields();
    }
}
