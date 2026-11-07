package com.example.DACK.service;

import com.example.DACK.dto.BookingRequest;
import com.example.DACK.dto.BookingSlotResponse;
import com.example.DACK.model.Booking;
import com.example.DACK.model.Booking.BookingStatus;
import com.example.DACK.model.Field;
import com.example.DACK.model.User;
import com.example.DACK.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final BookingRepository bookingRepository;
    private final FieldService fieldService;
    private final UserService userService;

    public List<Booking> getBookingsByUsername(String username) {
        return bookingRepository.findByUserUsernameOrderByCreatedAtDesc(username);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findWithFieldAndUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt sân."));
    }

    public List<BookingSlotResponse> getBookedSlots(Long fieldId, LocalDate date) {
        return bookingRepository.findByFieldIdAndBookingDateAndStatusInOrderByStartTimeAsc(
                        fieldId,
                        date,
                        EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED)
                ).stream()
                .map(booking -> BookingSlotResponse.builder()
                        .startTime(booking.getStartTime().format(TIME_FORMATTER))
                        .endTime(booking.getEndTime().format(TIME_FORMATTER))
                        .status(booking.getStatus().name())
                        .statusLabel(booking.getStatus() == BookingStatus.APPROVED ? "Đã duyệt" : "Chờ duyệt")
                        .build())
                .toList();
    }

    @Transactional
    public Booking createBooking(String username, BookingRequest request) {
        validateBookingRequest(request);

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        Field field = fieldService.getFieldById(request.getFieldId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sân bóng."));

        if (hasConflict(request.getFieldId(), request.getBookingDate(), request.getStartTime(), request.getEndTime())) {
            throw new IllegalArgumentException("Khung giờ này đã có người đặt hoặc đang chờ duyệt.");
        }

        Booking booking = Booking.builder()
                .field(field)
                .user(user)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .note(request.getNote())
                .status(BookingStatus.PENDING)
                .totalPrice(calculateTotalPrice(field.getPrice(), request.getStartTime(), request.getEndTime()))
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking approveBooking(Long id) {
        Booking booking = getBookingById(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Đơn đã bị hủy, không thể duyệt.");
        }
        if (hasConflict(booking.getField().getId(), booking.getBookingDate(), booking.getStartTime(), booking.getEndTime(), booking.getId())) {
            throw new IllegalArgumentException("Không thể duyệt vì khung giờ đã phát sinh đơn khác.");
        }
        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    public boolean hasConflict(Long fieldId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        return bookingRepository.existsOverlappingBooking(
                fieldId,
                date,
                startTime,
                endTime,
                EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );
    }

    public double calculateTotalPrice(Double hourlyPrice, LocalTime startTime, LocalTime endTime) {
        long minutes = Duration.between(startTime, endTime).toMinutes();
        double hourlyRate = hourlyPrice == null ? 0D : hourlyPrice;
        return (hourlyRate * minutes) / 60.0;
    }

    private boolean hasConflict(Long fieldId, LocalDate date, LocalTime startTime, LocalTime endTime, Long ignoreBookingId) {
        return bookingRepository.existsOverlappingBookingExcludingId(
                ignoreBookingId,
                fieldId,
                date,
                startTime,
                endTime,
                EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );
    }

    private void validateBookingRequest(BookingRequest request) {
        if (request.getFieldId() == null) {
            throw new IllegalArgumentException("Thiếu thông tin sân bóng.");
        }
        if (request.getBookingDate() == null || request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Vui lòng chọn đầy đủ ngày và giờ đặt sân.");
        }
        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Không thể đặt sân cho ngày trong quá khứ.");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu.");
        }
        if (request.getStartTime().getMinute() != 0 || request.getEndTime().getMinute() != 0) {
            throw new IllegalArgumentException("Giờ đặt phải theo mốc tròn giờ.");
        }
        if (Duration.between(request.getStartTime(), request.getEndTime()).toHours() < 1) {
            throw new IllegalArgumentException("Thời gian đặt tối thiểu là 1 giờ.");
        }
        LocalDateTime bookingStart = LocalDateTime.of(request.getBookingDate(), request.getStartTime());
        if (bookingStart.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Giờ bắt đầu phải lớn hơn thời điểm hiện tại.");
        }
    }
}
