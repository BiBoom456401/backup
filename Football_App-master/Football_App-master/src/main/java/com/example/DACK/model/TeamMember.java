package com.example.DACK.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Họ tên thành viên không được để trống.")
    @Column(nullable = false)
    private String fullName;

    @Min(value = 0, message = "Số áo không hợp lệ.")
    @Column(nullable = false)
    private Integer jerseyNumber;

    @NotBlank(message = "Vị trí không được để trống.")
    @Column(nullable = false)
    private String position;

    private String phoneNumber;

    private String email;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}
