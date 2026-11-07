package com.example.DACK.repository;

import com.example.DACK.model.Tournament;
import com.example.DACK.model.Tournament.TournamentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {

    @Override
    @EntityGraph(attributePaths = "field")
    List<Tournament> findAll();

    @Override
    @EntityGraph(attributePaths = "field")
    Optional<Tournament> findById(Long id);

    // ========== THÊM CÁC METHOD CHO DASHBOARD ==========

    /**
     * Đếm số lượng giải đấu theo trạng thái
     */
    long countByStatus(TournamentStatus status);

    /**
     * Tìm giải đấu theo trạng thái
     */
    List<Tournament> findByStatus(TournamentStatus status);

    /**
     * Lấy 5 giải đấu gần đây nhất theo ngày bắt đầu
     */
    List<Tournament> findTop5ByOrderByStartDateDesc();

    /**
     * Lấy tất cả giải đấu sắp xếp theo ngày bắt đầu giảm dần
     */
    List<Tournament> findAllByOrderByStartDateDesc();
}