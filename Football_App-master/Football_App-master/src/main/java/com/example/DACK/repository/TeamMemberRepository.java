package com.example.DACK.repository;

import com.example.DACK.model.TeamMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    @EntityGraph(attributePaths = "team")
    List<TeamMember> findByTeamIdOrderByJerseyNumberAsc(Long teamId);

    @EntityGraph(attributePaths = "team")
    Optional<TeamMember> findByIdAndTeamId(Long id, Long teamId);

    boolean existsByTeamIdAndJerseyNumber(Long teamId, Integer jerseyNumber);
    boolean existsByTeamIdAndJerseyNumberAndIdNot(Long teamId, Integer jerseyNumber, Long id);
    long countByTeamId(Long teamId);
}
