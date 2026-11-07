package com.example.DACK.controller;

import com.example.DACK.model.Tournament;
import com.example.DACK.service.FieldService;
import com.example.DACK.service.MatchService;
import com.example.DACK.service.TeamService;
import com.example.DACK.service.TournamentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class TournamentController {
    private final TournamentService tournamentService;
    private final TeamService teamService;
    private final MatchService matchService;
    private final FieldService fieldService;

    @GetMapping("/tournaments")
    public String listTournaments(Model model) {
        model.addAttribute("tournaments", tournamentService.getAllTournaments());
        return "tournaments/list";
    }

    @GetMapping("/tournaments/{id}")
    public String tournamentDetail(@PathVariable Long id,
                                   @AuthenticationPrincipal UserDetails userDetails,
                                   Model model) {
        model.addAttribute("tournament", tournamentService.getTournamentById(id).orElse(null));
        if (userDetails != null) {
            model.addAttribute("myTeams", teamService.getTeamsByCaptain(userDetails.getUsername()));
        }
        model.addAttribute("matches", matchService.getMatchesByTournament(id));
        return "tournaments/detail";
    }

    @GetMapping("/admin/tournaments")
    public String adminTournaments(Model model) {
        model.addAttribute("tournaments", tournamentService.getAllTournaments());
        return "admin/tournaments";
    }

    @GetMapping("/admin/tournaments/add")
    public String addTournamentForm(Model model) {
        model.addAttribute("tournament", new Tournament());
        model.addAttribute("statuses", Tournament.TournamentStatus.values());
        model.addAttribute("fields", fieldService.getAllFields());
        return "admin/tournament_form";
    }

    @GetMapping("/admin/tournaments/edit/{id}")
    public String editTournamentForm(@PathVariable Long id, Model model) {
        model.addAttribute("tournament", tournamentService.getTournamentById(id).orElse(null));
        model.addAttribute("statuses", Tournament.TournamentStatus.values());
        model.addAttribute("fields", fieldService.getAllFields());
        return "admin/tournament_form";
    }

    @PostMapping("/admin/tournaments/save")
    public String saveTournament(@Valid @ModelAttribute("tournament") Tournament tournament,
                                 BindingResult bindingResult,
                                 Model model) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("statuses", Tournament.TournamentStatus.values());
            model.addAttribute("fields", fieldService.getAllFields());
            return "admin/tournament_form";
        }

        try {
            tournamentService.saveTournament(tournament);
            return "redirect:/admin/tournaments";
        } catch (IllegalArgumentException | DataIntegrityViolationException ex) {
            model.addAttribute("statuses", Tournament.TournamentStatus.values());
            model.addAttribute("fields", fieldService.getAllFields());
            model.addAttribute("errorMessage", ex.getMessage());
            return "admin/tournament_form";
        } catch (Exception ex) {
            model.addAttribute("statuses", Tournament.TournamentStatus.values());
            model.addAttribute("fields", fieldService.getAllFields());
            model.addAttribute("errorMessage", "Không thể lưu giải đấu. Vui lòng kiểm tra lại dữ liệu đã nhập.");
            return "admin/tournament_form";
        }
    }

    @GetMapping("/admin/tournaments/delete/{id}")
    public String deleteTournament(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            tournamentService.deleteTournament(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa giải đấu thành công.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/admin/tournaments";
    }
}
