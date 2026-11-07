package com.example.DACK.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team1_id", nullable = false)
    private Team team1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team2_id", nullable = false)
    private Team team2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Builder.Default
    private Integer score1 = 0;

    @Builder.Default
    private Integer score2 = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status;

    public enum MatchStatus {
        SCHEDULED,
        ONGOING,
        FINISHED,
        CANCELLED
    }
}
