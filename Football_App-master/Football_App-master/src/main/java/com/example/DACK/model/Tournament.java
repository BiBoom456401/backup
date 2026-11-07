package com.example.DACK.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "tournaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên giải đấu không được để trống.")
    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @NotNull(message = "Ngày bắt đầu là bắt buộc.")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc là bắt buộc.")
    @Column(nullable = false)
    private LocalDate endDate;

    @NotNull(message = "Giờ bắt đầu là bắt buộc.")
    @Column(nullable = false)
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc là bắt buộc.")
    @Column(nullable = false)
    private LocalTime endTime;

    @NotNull(message = "Hạn đăng ký là bắt buộc.")
    @Column(nullable = false)
    private LocalDate registrationDeadline;

    @NotNull(message = "Số đội tối đa là bắt buộc.")
    @Min(value = 2, message = "Số đội tối đa phải từ 2 trở lên.")
    @Column(nullable = false)
    private Integer maxTeams;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    @NotNull(message = "Trạng thái là bắt buộc.")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentStatus status;

    public enum TournamentStatus {
        UPCOMING,
        ONGOING,
        COMPLETED
    }
}
