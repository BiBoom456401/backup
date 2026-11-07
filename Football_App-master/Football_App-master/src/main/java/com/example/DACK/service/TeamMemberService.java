package com.example.DACK.service;

import com.example.DACK.model.Team;
import com.example.DACK.model.TeamMember;
import com.example.DACK.model.TournamentRegistration;
import com.example.DACK.repository.TeamMemberRepository;
import com.example.DACK.repository.TournamentRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamMemberService {
    private final TeamMemberRepository teamMemberRepository;
    private final TeamService teamService;
    private final TournamentRegistrationRepository tournamentRegistrationRepository;

    public List<TeamMember> getMembersByTeam(Long teamId, String username) {
        teamService.getOwnedTeam(teamId, username);
        return teamMemberRepository.findByTeamIdOrderByJerseyNumberAsc(teamId);
    }

    public List<TournamentRegistration> getRegistrationsByTeam(Long teamId, String username) {
        teamService.getOwnedTeam(teamId, username);
        return tournamentRegistrationRepository.findByTeamId(teamId);
    }

    public TeamMember getOwnedMember(Long teamId, Long memberId, String username) {
        teamService.getOwnedTeam(teamId, username);
        return teamMemberRepository.findByIdAndTeamId(memberId, teamId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
    }

    public long countMembers(Long teamId) {
        return teamMemberRepository.countByTeamId(teamId);
    }

    public TeamMember createMember(Long teamId, TeamMember member, String username) {
        Team team = teamService.getOwnedTeam(teamId, username);
        validateMember(teamId, member, null);
        member.setId(null);
        member.setTeam(team);
        return teamMemberRepository.save(member);
    }

    public TeamMember updateMember(Long teamId, Long memberId, TeamMember input, String username) {
        TeamMember existing = getOwnedMember(teamId, memberId, username);
        validateMember(teamId, input, memberId);
        existing.setFullName(input.getFullName().trim());
        existing.setJerseyNumber(input.getJerseyNumber());
        existing.setPosition(input.getPosition().trim());
        existing.setPhoneNumber(normalize(input.getPhoneNumber()));
        existing.setEmail(normalize(input.getEmail()));
        return teamMemberRepository.save(existing);
    }

    public void deleteMember(Long teamId, Long memberId, String username) {
        TeamMember existing = getOwnedMember(teamId, memberId, username);
        teamMemberRepository.delete(existing);
    }

    private void validateMember(Long teamId, TeamMember member, Long memberId) {
        if (member.getFullName() == null || member.getFullName().isBlank()) {
            throw new IllegalArgumentException("Họ tên thành viên không được để trống.");
        }
        if (member.getPosition() == null || member.getPosition().isBlank()) {
            throw new IllegalArgumentException("Vị trí không được để trống.");
        }
        if (member.getJerseyNumber() == null || member.getJerseyNumber() < 0) {
            throw new IllegalArgumentException("Số áo không hợp lệ.");
        }

        boolean duplicated = memberId == null
                ? teamMemberRepository.existsByTeamIdAndJerseyNumber(teamId, member.getJerseyNumber())
                : teamMemberRepository.existsByTeamIdAndJerseyNumberAndIdNot(teamId, member.getJerseyNumber(), memberId);
        if (duplicated) {
            throw new IllegalArgumentException("Số áo đã tồn tại trong đội.");
        }

        member.setFullName(member.getFullName().trim());
        member.setPosition(member.getPosition().trim());
        member.setPhoneNumber(normalize(member.getPhoneNumber()));
        member.setEmail(normalize(member.getEmail()));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
