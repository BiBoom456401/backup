package com.example.DACK.controller;

import com.example.DACK.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {

        // Doanh thu
        model.addAttribute("totalRevenue", String.format("%,.0f", dashboardService.getTotalRevenue()));
        model.addAttribute("monthlyRevenue", String.format("%,.0f", dashboardService.getMonthlyRevenue()));
        model.addAttribute("todayRevenue", String.format("%,.0f", dashboardService.getTodayRevenue()));

        // Số đơn
        model.addAttribute("totalBookings", dashboardService.getTotalBookings());
        model.addAttribute("approvedBookings", dashboardService.getApprovedBookings());
        model.addAttribute("pendingBookings", dashboardService.getPendingBookings());
        model.addAttribute("cancelledBookings", dashboardService.getCancelledBookings());

        // Số giải
        model.addAttribute("totalTournaments", dashboardService.getTotalTournaments());
        model.addAttribute("ongoingTournaments", dashboardService.getOngoingTournaments());
        model.addAttribute("upcomingTournaments", dashboardService.getUpcomingTournaments());
        model.addAttribute("finishedTournaments", dashboardService.getFinishedTournaments());

        // Người dùng
        model.addAttribute("totalUsers", dashboardService.getTotalUsers());

        return "admin/dashboard";
    }
}