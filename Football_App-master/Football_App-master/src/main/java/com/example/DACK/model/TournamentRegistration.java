package com.example.DACK.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private LocalDateTime registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status;

    public enum RegistrationStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @PrePersist
    public void prePersist() {
        if (registrationDate == null) {
            registrationDate = LocalDateTime.now();
        }
        if (status == null) {
            status = RegistrationStatus.PENDING;
        }
    }
}
