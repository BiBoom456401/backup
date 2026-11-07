package com.example.DACK.controller;

import com.example.DACK.model.Match;
import com.example.DACK.model.Tournament;
import com.example.DACK.service.MatchService;
import com.example.DACK.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class MatchController {
    private final MatchService matchService;
    private final TournamentService tournamentService;

    @PostMapping("/admin/tournaments/{id}/generate-matches")
    public String generateMatches(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            matchService.generateSequentialMatches(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã xếp lịch thi đấu thành công.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments/" + id + "/registrations";
    }

    @GetMapping("/admin/tournaments/{id}/matches")
    public String adminMatches(@PathVariable Long id, Model model) {
        Tournament tournament = tournamentService.getTournamentById(id).orElse(null);
        model.addAttribute("tournament", tournament);
        model.addAttribute("matches", matchService.getMatchesByTournament(id));
        model.addAttribute("approvedTeams", matchService.getApprovedTeamsForTournament(id));
        model.addAttribute("statuses", Match.MatchStatus.values());
        return "admin/tournament_matches";
    }

    @PostMapping("/admin/tournaments/{id}/matches/manual")
    public String createManualMatch(@PathVariable Long id,
                                    @RequestParam Long team1Id,
                                    @RequestParam Long team2Id,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
                                    @RequestParam Match.MatchStatus status,
                                    RedirectAttributes redirectAttributes) {
        try {
            matchService.createManualMatch(id, team1Id, team2Id, startTime, status);
            redirectAttributes.addFlashAttribute("successMessage", "Đã thêm lịch thi đấu thủ công.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments/" + id + "/matches";
    }

    @PostMapping("/admin/matches/{id}/result")
    public String updateResult(@PathVariable Long id,
                               @RequestParam Integer score1,
                               @RequestParam Integer score2,
                               @RequestParam Match.MatchStatus status,
                               @RequestParam Long tournamentId,
                               RedirectAttributes redirectAttributes) {
        try {
            matchService.updateResult(id, score1, score2, status);
            redirectAttributes.addFlashAttribute("successMessage", "Đã cập nhật kết quả trận đấu.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments/" + tournamentId + "/matches";
    }
}
