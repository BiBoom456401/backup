package com.example.DACK.service;

import com.example.DACK.model.Team;
import com.example.DACK.model.Tournament;
import com.example.DACK.model.TournamentRegistration;
import com.example.DACK.repository.TeamRepository;
import com.example.DACK.repository.TournamentRegistrationRepository;
import com.example.DACK.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TournamentRegistrationService {
    private final TournamentRegistrationRepository tournamentRegistrationRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public List<TournamentRegistration> getRegistrationsByTournament(Long tournamentId) {
        return tournamentRegistrationRepository.findByTournamentId(tournamentId);
    }

    public void registerTeam(Long tournamentId, Long teamId, String username) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giải đấu."));

        Team team = teamRepository.findByIdAndCaptainUsername(teamId, username)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chỉ được đăng ký đội do mình làm đội trưởng."));

        if (tournament.getStatus() != Tournament.TournamentStatus.UPCOMING) {
            throw new IllegalArgumentException("Chỉ có thể đăng ký đội vào giải đấu sắp diễn ra.");
        }

        if (tournament.getRegistrationDeadline() != null
                && tournament.getRegistrationDeadline().isBefore(LocalDateTime.now().toLocalDate())) {
            throw new IllegalArgumentException("Đã quá hạn đăng ký giải đấu.");
        }

        if (tournament.getStartDate() != null && tournament.getStartDate().isBefore(LocalDateTime.now().toLocalDate())) {
            throw new IllegalArgumentException("Giải đấu đã qua ngày bắt đầu, không thể đăng ký thêm.");
        }

        long currentRegistrations = tournamentRegistrationRepository.findByTournamentId(tournamentId).size();
        if (tournament.getMaxTeams() != null && currentRegistrations >= tournament.getMaxTeams()) {
            throw new IllegalArgumentException("Giải đấu đã đủ số đội tối đa.");
        }

        if (tournamentRegistrationRepository.existsByTournamentIdAndTeamId(tournamentId, teamId)) {
            throw new IllegalArgumentException("Đội này đã đăng ký giải đấu rồi.");
        }

        TournamentRegistration registration = TournamentRegistration.builder()
                .tournament(tournament)
                .team(team)
                .registrationDate(LocalDateTime.now())
                .status(TournamentRegistration.RegistrationStatus.PENDING)
                .build();

        tournamentRegistrationRepository.save(registration);
    }

    public void approveRegistration(Long registrationId) {
        TournamentRegistration registration = tournamentRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đăng ký."));

        Tournament tournament = registration.getTournament();
        long approvedCount = tournamentRegistrationRepository
                .findByTournamentIdAndStatus(tournament.getId(), TournamentRegistration.RegistrationStatus.APPROVED)
                .size();

        if (tournament.getMaxTeams() != null && approvedCount >= tournament.getMaxTeams()) {
            throw new IllegalArgumentException("Giải đấu đã đủ số đội được duyệt theo giới hạn tối đa.");
        }

        registration.setStatus(TournamentRegistration.RegistrationStatus.APPROVED);
        tournamentRegistrationRepository.save(registration);
    }

    public void rejectRegistration(Long registrationId) {
        TournamentRegistration registration = tournamentRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đăng ký."));
        registration.setStatus(TournamentRegistration.RegistrationStatus.REJECTED);
        tournamentRegistrationRepository.save(registration);
    }
}
