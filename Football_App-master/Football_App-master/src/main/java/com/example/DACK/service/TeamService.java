package com.example.DACK.service;

import com.example.DACK.model.Team;
import com.example.DACK.model.User;
import com.example.DACK.repository.MatchRepository;
import com.example.DACK.repository.TeamRepository;
import com.example.DACK.repository.TournamentRegistrationRepository;
import com.example.DACK.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TournamentRegistrationRepository tournamentRegistrationRepository;
    private final MatchRepository matchRepository;

    public List<Team> getTeamsByCaptain(String username) {
        return teamRepository.findByCaptainUsername(username);
    }

    public Team getOwnedTeam(Long id, String username) {
        return teamRepository.findByIdAndCaptainUsername(id, username)
                .orElseThrow(() -> new IllegalArgumentException("Bạn không có quyền truy cập đội này."));
    }

    public Team createTeam(Team team, String username) {
        validateTeam(team, null);
        User captain = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng hiện tại."));
        team.setId(null);
        team.setCaptain(captain);
        return teamRepository.save(team);
    }

    public Team updateTeam(Long id, Team input, String username) {
        Team existing = getOwnedTeam(id, username);
        validateTeam(input, id);
        existing.setName(input.getName().trim());
        existing.setLogoUrl(input.getLogoUrl());
        return teamRepository.save(existing);
    }

    public void deleteTeam(Long id, String username) {
        Team existing = getOwnedTeam(id, username);

        if (tournamentRegistrationRepository.existsByTeamId(id)) {
            throw new IllegalArgumentException("Không thể xóa đội đã đăng ký giải đấu.");
        }

        if (matchRepository.existsByTeam1IdOrTeam2Id(id, id)) {
            throw new IllegalArgumentException("Không thể xóa đội đã có lịch thi đấu.");
        }

        teamRepository.delete(existing);
    }

    private void validateTeam(Team team, Long teamId) {
        if (team.getName() == null || team.getName().isBlank()) {
            throw new IllegalArgumentException("Tên đội không được để trống.");
        }

        String normalizedName = team.getName().trim();
        boolean duplicated = teamId == null
                ? teamRepository.existsByNameIgnoreCase(normalizedName)
                : teamRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, teamId);
        if (duplicated) {
            throw new IllegalArgumentException("Tên đội đã tồn tại.");
        }

        team.setName(normalizedName);
    }
}
