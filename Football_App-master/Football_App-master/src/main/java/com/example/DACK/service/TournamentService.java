package com.example.DACK.service;

import com.example.DACK.model.Tournament;
import com.example.DACK.repository.MatchRepository;
import com.example.DACK.repository.TournamentRegistrationRepository;
import com.example.DACK.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    private final TournamentRegistrationRepository tournamentRegistrationRepository;
    private final MatchRepository matchRepository;

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Optional<Tournament> getTournamentById(Long id) {
        return tournamentRepository.findById(id);
    }

    public Tournament saveTournament(Tournament tournament) {
        validateTournament(tournament);
        return tournamentRepository.save(tournament);
    }

    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giải đấu."));

        if (tournamentRegistrationRepository.existsByTournamentId(id)) {
            throw new IllegalArgumentException("Không thể xóa giải đấu đã có đội đăng ký.");
        }

        if (matchRepository.existsByTournamentId(id)) {
            throw new IllegalArgumentException("Không thể xóa giải đấu đã có lịch thi đấu.");
        }

        tournamentRepository.delete(tournament);
    }

    private void validateTournament(Tournament tournament) {
        if (tournament.getName() == null || tournament.getName().isBlank()) {
            throw new IllegalArgumentException("Tên giải đấu không được để trống.");
        }
        if (tournament.getStartDate() == null) {
            throw new IllegalArgumentException("Ngày bắt đầu là bắt buộc.");
        }
        if (tournament.getEndDate() == null) {
            throw new IllegalArgumentException("Ngày kết thúc là bắt buộc.");
        }
        if (tournament.getStartTime() == null) {
            throw new IllegalArgumentException("Giờ bắt đầu là bắt buộc.");
        }
        if (tournament.getEndTime() == null) {
            throw new IllegalArgumentException("Giờ kết thúc là bắt buộc.");
        }
        if (tournament.getRegistrationDeadline() == null) {
            throw new IllegalArgumentException("Hạn đăng ký là bắt buộc.");
        }
        if (tournament.getMaxTeams() == null || tournament.getMaxTeams() < 2) {
            throw new IllegalArgumentException("Số đội tối đa phải từ 2 trở lên.");
        }
        if (tournament.getStatus() == null) {
            throw new IllegalArgumentException("Trạng thái là bắt buộc.");
        }

        if (tournament.getStartDate().isAfter(tournament.getEndDate())) {
            throw new IllegalArgumentException("Ngày bắt đầu không được trễ hơn ngày kết thúc.");
        }

        if (tournament.getRegistrationDeadline().isAfter(tournament.getStartDate())) {
            throw new IllegalArgumentException("Hạn đăng ký không được sau ngày bắt đầu.");
        }

        if (tournament.getStartDate().isEqual(tournament.getEndDate())
                && !tournament.getStartTime().isBefore(tournament.getEndTime())) {
            throw new IllegalArgumentException("Nếu giải đấu diễn ra trong cùng một ngày thì giờ bắt đầu phải sớm hơn giờ kết thúc.");
        }

        if (tournament.getStatus() == Tournament.TournamentStatus.COMPLETED
                && tournament.getEndDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Không thể đặt trạng thái COMPLETED cho giải đấu chưa kết thúc.");
        }
    }
}
