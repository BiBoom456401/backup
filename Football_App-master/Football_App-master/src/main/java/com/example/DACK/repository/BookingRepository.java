package com.example.DACK.repository;

import com.example.DACK.model.Booking;
import com.example.DACK.model.Booking.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"field", "user"})
    List<Booking> findByUserUsernameOrderByCreatedAtDesc(String username);

    @EntityGraph(attributePaths = {"field", "user"})
    List<Booking> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"field", "user"})
    Optional<Booking> findWithFieldAndUserById(Long id);

    List<Booking> findByFieldIdAndBookingDateAndStatusInOrderByStartTimeAsc(Long fieldId,
                                                                            LocalDate bookingDate,
                                                                            Collection<BookingStatus> statuses);

    @Query("""
            select count(b) > 0
            from Booking b
            where b.field.id = :fieldId
              and b.bookingDate = :bookingDate
              and b.status in :statuses
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    boolean existsOverlappingBooking(Long fieldId,
                                     LocalDate bookingDate,
                                     LocalTime startTime,
                                     LocalTime endTime,
                                     Collection<BookingStatus> statuses);

    @Query("""
            select count(b) > 0
            from Booking b
            where b.id <> :bookingId
              and b.field.id = :fieldId
              and b.bookingDate = :bookingDate
              and b.status in :statuses
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    boolean existsOverlappingBookingExcludingId(Long bookingId,
                                                Long fieldId,
                                                LocalDate bookingDate,
                                                LocalTime startTime,
                                                LocalTime endTime,
                                                Collection<BookingStatus> statuses);



    /**
     * Đếm số lượng booking theo trạng thái
     */
    long countByStatus(BookingStatus status);

    /**
     * Tính tổng doanh thu theo trạng thái
     */
    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status")
    Double sumTotalPriceByStatus(@Param("status") BookingStatus status);

    /**
     * Tính tổng doanh thu theo khoảng thời gian và trạng thái
     */
    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status AND b.bookingDate BETWEEN :startDate AND :endDate")
    Double sumTotalPriceByDateRange(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("status") BookingStatus status);

    /**
     * Lấy 5 booking gần nhất
     */
    List<Booking> findTop5ByOrderByCreatedAtDesc();
}