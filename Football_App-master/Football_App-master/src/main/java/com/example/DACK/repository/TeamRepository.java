package com.example.DACK.repository;

import com.example.DACK.model.Team;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    @EntityGraph(attributePaths = "captain")
    List<Team> findByCaptainUsername(String username);

    @EntityGraph(attributePaths = "captain")
    Optional<Team> findByIdAndCaptainUsername(Long id, String username);

    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
