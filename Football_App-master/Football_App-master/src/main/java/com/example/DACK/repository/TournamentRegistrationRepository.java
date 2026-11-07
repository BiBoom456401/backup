package com.example.DACK.repository;

import com.example.DACK.model.TournamentRegistration;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {
    @EntityGraph(attributePaths = {"tournament", "team", "team.captain"})
    List<TournamentRegistration> findByTournamentId(Long tournamentId);

    @EntityGraph(attributePaths = {"tournament", "team", "team.captain"})
    List<TournamentRegistration> findByTeamId(Long teamId);

    @EntityGraph(attributePaths = {"tournament", "team", "team.captain"})
    List<TournamentRegistration> findByTournamentIdAndStatus(Long tournamentId, TournamentRegistration.RegistrationStatus status);

    boolean existsByTournamentIdAndTeamId(Long tournamentId, Long teamId);
    boolean existsByTournamentId(Long tournamentId);
    boolean existsByTeamId(Long teamId);

    @EntityGraph(attributePaths = {"tournament", "team", "team.captain"})
    Optional<TournamentRegistration> findById(Long id);
}
