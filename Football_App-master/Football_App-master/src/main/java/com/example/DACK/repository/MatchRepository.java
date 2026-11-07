package com.example.DACK.repository;

import com.example.DACK.model.Match;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    @EntityGraph(attributePaths = {"tournament", "team1", "team2"})
    List<Match> findByTournamentIdOrderByStartTimeAsc(Long tournamentId);

    boolean existsByTournamentId(Long tournamentId);

    boolean existsByTeam1IdOrTeam2Id(Long team1Id, Long team2Id);

    boolean existsByTournamentIdAndStartTime(Long tournamentId, LocalDateTime startTime);

    boolean existsByTournamentIdAndStartTimeAndTeam1IdOrTournamentIdAndStartTimeAndTeam2Id(
            Long tournamentId1, LocalDateTime startTime1, Long team1Id,
            Long tournamentId2, LocalDateTime startTime2, Long team2Id
    );

    @EntityGraph(attributePaths = {"tournament", "team1", "team2"})
    Optional<Match> findById(Long id);
}
