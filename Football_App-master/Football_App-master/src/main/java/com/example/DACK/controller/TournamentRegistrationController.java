package com.example.DACK.controller;

import com.example.DACK.model.Tournament;
import com.example.DACK.service.TeamService;
import com.example.DACK.service.TournamentRegistrationService;
import com.example.DACK.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class TournamentRegistrationController {
    private final TournamentRegistrationService tournamentRegistrationService;
    private final TournamentService tournamentService;
    private final TeamService teamService;

    @PostMapping("/tournaments/{id}/register")
    public String registerTeam(@PathVariable Long id,
                               @RequestParam Long teamId,
                               @AuthenticationPrincipal UserDetails userDetails,
                               RedirectAttributes redirectAttributes) {
        try {
            tournamentRegistrationService.registerTeam(id, teamId, userDetails.getUsername());
            redirectAttributes.addFlashAttribute("successMessage", "Đăng ký đội thành công. Đơn đang chờ admin duyệt.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/tournaments/" + id;
    }

    @GetMapping("/admin/tournaments/{id}/registrations")
    public String registrationList(@PathVariable Long id, Model model) {
        Tournament tournament = tournamentService.getTournamentById(id).orElse(null);
        model.addAttribute("tournament", tournament);
        model.addAttribute("registrations", tournamentRegistrationService.getRegistrationsByTournament(id));
        return "admin/tournament_registrations";
    }

    @PostMapping("/admin/registrations/{id}/approve")
    public String approveRegistration(@PathVariable Long id,
                                      @RequestParam Long tournamentId,
                                      RedirectAttributes redirectAttributes) {
        try {
            tournamentRegistrationService.approveRegistration(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã duyệt đội tham gia giải đấu.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments/" + tournamentId + "/registrations";
    }

    @PostMapping("/admin/registrations/{id}/reject")
    public String rejectRegistration(@PathVariable Long id,
                                     @RequestParam Long tournamentId,
                                     RedirectAttributes redirectAttributes) {
        try {
            tournamentRegistrationService.rejectRegistration(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối đơn đăng ký.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments/" + tournamentId + "/registrations";
    }
}
