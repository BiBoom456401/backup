package com.example.DACK.service;

import com.example.DACK.model.Match;
import com.example.DACK.model.Team;
import com.example.DACK.model.Tournament;
import com.example.DACK.model.TournamentRegistration;
import com.example.DACK.repository.MatchRepository;
import com.example.DACK.repository.TeamRepository;
import com.example.DACK.repository.TournamentRegistrationRepository;
import com.example.DACK.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRegistrationRepository tournamentRegistrationRepository;
    private final TeamRepository teamRepository;

    public List<Match> getMatchesByTournament(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByStartTimeAsc(tournamentId);
    }

    public Match getMatchById(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy trận đấu."));
    }

    public List<Team> getApprovedTeamsForTournament(Long tournamentId) {
        return tournamentRegistrationRepository
                .findByTournamentIdAndStatus(tournamentId, TournamentRegistration.RegistrationStatus.APPROVED)
                .stream()
                .map(TournamentRegistration::getTeam)
                .toList();
    }

    public void generateSequentialMatches(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giải đấu."));

        if (tournament.getStatus() == Tournament.TournamentStatus.COMPLETED) {
            throw new IllegalArgumentException("Không thể xếp lịch cho giải đấu đã kết thúc.");
        }

        if (matchRepository.existsByTournamentId(tournamentId)) {
            throw new IllegalArgumentException("Giải đấu này đã được xếp lịch trước đó.");
        }

        List<TournamentRegistration> approvedRegistrations =
                tournamentRegistrationRepository.findByTournamentIdAndStatus(
                        tournamentId,
                        TournamentRegistration.RegistrationStatus.APPROVED
                );

        if (approvedRegistrations.size() < 2) {
            throw new IllegalArgumentException("Cần ít nhất 2 đội đã được duyệt để xếp lịch.");
        }

        if (approvedRegistrations.size() % 2 != 0) {
            throw new IllegalArgumentException("Số đội được duyệt đang lẻ. Hãy duyệt thêm hoặc từ chối bớt để đủ cặp.");
        }

        LocalDateTime matchTime = LocalDateTime.of(tournament.getStartDate(), tournament.getStartTime());

        for (int i = 0; i < approvedRegistrations.size(); i += 2) {
            Team team1 = approvedRegistrations.get(i).getTeam();
            Team team2 = approvedRegistrations.get(i + 1).getTeam();

            Match match = Match.builder()
                    .tournament(tournament)
                    .team1(team1)
                    .team2(team2)
                    .startTime(matchTime)
                    .score1(0)
                    .score2(0)
                    .status(Match.MatchStatus.SCHEDULED)
                    .build();

            matchRepository.save(match);
            matchTime = matchTime.plusHours(2);
        }
    }

    public void createManualMatch(Long tournamentId,
                                  Long team1Id,
                                  Long team2Id,
                                  LocalDateTime startTime,
                                  Match.MatchStatus status) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giải đấu."));

        if (team1Id == null || team2Id == null) {
            throw new IllegalArgumentException("Phải chọn đủ 2 đội.");
        }
        if (team1Id.equals(team2Id)) {
            throw new IllegalArgumentException("Hai đội thi đấu phải khác nhau.");
        }
        if (startTime == null) {
            throw new IllegalArgumentException("Thời gian thi đấu là bắt buộc.");
        }
        if (status == null) {
            throw new IllegalArgumentException("Trạng thái trận đấu là bắt buộc.");
        }

        LocalDateTime tournamentStart = LocalDateTime.of(tournament.getStartDate(), tournament.getStartTime());
        LocalDateTime tournamentEnd = LocalDateTime.of(tournament.getEndDate(), tournament.getEndTime());
        if (startTime.isBefore(tournamentStart) || startTime.isAfter(tournamentEnd)) {
            throw new IllegalArgumentException("Thời gian trận đấu phải nằm trong khoảng thời gian của giải.");
        }

        if (matchRepository.existsByTournamentIdAndStartTime(tournamentId, startTime)) {
            throw new IllegalArgumentException("Đã có trận khác trong giải đấu ở đúng thời điểm này.");
        }

        if (matchRepository.existsByTournamentIdAndStartTimeAndTeam1IdOrTournamentIdAndStartTimeAndTeam2Id(
                tournamentId, startTime, team1Id, tournamentId, startTime, team1Id)
                || matchRepository.existsByTournamentIdAndStartTimeAndTeam1IdOrTournamentIdAndStartTimeAndTeam2Id(
                tournamentId, startTime, team2Id, tournamentId, startTime, team2Id)) {
            throw new IllegalArgumentException("Một trong hai đội đã có trận đấu khác ở cùng thời điểm.");
        }

        List<Team> approvedTeams = getApprovedTeamsForTournament(tournamentId);
        boolean validTeam1 = approvedTeams.stream().anyMatch(team -> team.getId().equals(team1Id));
        boolean validTeam2 = approvedTeams.stream().anyMatch(team -> team.getId().equals(team2Id));
        if (!validTeam1 || !validTeam2) {
            throw new IllegalArgumentException("Chỉ được chọn các đội đã được duyệt tham gia giải.");
        }

        Team team1 = teamRepository.findById(team1Id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đội 1."));
        Team team2 = teamRepository.findById(team2Id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đội 2."));

        Match match = Match.builder()
                .tournament(tournament)
                .team1(team1)
                .team2(team2)
                .startTime(startTime)
                .score1(0)
                .score2(0)
                .status(status)
                .build();

        matchRepository.save(match);
    }

    public void updateResult(Long matchId, Integer score1, Integer score2, Match.MatchStatus status) {
        Match match = getMatchById(matchId);

        if (score1 == null || score1 < 0 || score2 == null || score2 < 0) {
            throw new IllegalArgumentException("Tỉ số không hợp lệ.");
        }
        if (status == null) {
            throw new IllegalArgumentException("Trạng thái trận đấu là bắt buộc.");
        }

        match.setScore1(score1);
        match.setScore2(score2);
        match.setStatus(status);
        matchRepository.save(match);
    }
}
