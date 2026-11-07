package com.example.DACK.service;

import com.example.DACK.model.Booking;
import com.example.DACK.model.Tournament;
import com.example.DACK.repository.BookingRepository;
import com.example.DACK.repository.TournamentRepository;
import com.example.DACK.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DashboardService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    // ========== 1. THỐNG KÊ DOANH THU ==========

    public double getTotalRevenue() {
        Double revenue = bookingRepository.sumTotalPriceByStatus(Booking.BookingStatus.APPROVED);
        return revenue != null ? revenue : 0.0;
    }

    public double getMonthlyRevenue() {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        Double revenue = bookingRepository.sumTotalPriceByDateRange(startOfMonth, endOfMonth, Booking.BookingStatus.APPROVED);
        return revenue != null ? revenue : 0.0;
    }

    public double getTodayRevenue() {
        LocalDate today = LocalDate.now();
        Double revenue = bookingRepository.sumTotalPriceByDateRange(today, today, Booking.BookingStatus.APPROVED);
        return revenue != null ? revenue : 0.0;
    }

    // ========== 2. THỐNG KÊ SỐ LƯỢNG ĐƠN ==========

    public long getTotalBookings() {
        return bookingRepository.count();
    }

    public long getApprovedBookings() {
        return bookingRepository.countByStatus(Booking.BookingStatus.APPROVED);
    }

    public long getPendingBookings() {
        return bookingRepository.countByStatus(Booking.BookingStatus.PENDING);
    }

    public long getCancelledBookings() {
        return bookingRepository.countByStatus(Booking.BookingStatus.CANCELLED);
    }

    // ========== 3. THỐNG KÊ SỐ GIẢI ==========

    public long getTotalTournaments() {
        return tournamentRepository.count();
    }

    public long getOngoingTournaments() {
        return tournamentRepository.countByStatus(Tournament.TournamentStatus.ONGOING);
    }

    public long getUpcomingTournaments() {
        return tournamentRepository.countByStatus(Tournament.TournamentStatus.UPCOMING);
    }

    // SỬA: FINISHED → COMPLETED
    public long getFinishedTournaments() {
        return tournamentRepository.countByStatus(Tournament.TournamentStatus.COMPLETED);
    }

    // ========== 4. THỐNG KÊ NGƯỜI DÙNG ==========

    public long getTotalUsers() {
        return userRepository.count();
    }
}