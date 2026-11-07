package com.example.DACK.controller;

import com.example.DACK.model.Team;
import com.example.DACK.service.TeamService;
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
public class TeamController {
    private final TeamService teamService;

    @GetMapping("/teams/my")
    public String myTeams(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        model.addAttribute("teams", teamService.getTeamsByCaptain(userDetails.getUsername()));
        return "teams/my_teams";
    }

    @GetMapping("/teams/add")
    public String addTeamForm(Model model) {
        model.addAttribute("team", new Team());
        return "teams/team_form";
    }

    @GetMapping("/teams/edit/{id}")
    public String editTeamForm(@PathVariable Long id,
                               @AuthenticationPrincipal UserDetails userDetails,
                               Model model) {
        model.addAttribute("team", teamService.getOwnedTeam(id, userDetails.getUsername()));
        return "teams/team_form";
    }

    @PostMapping("/teams/save")
    public String saveTeam(@Valid @ModelAttribute("team") Team team,
                           BindingResult bindingResult,
                           @AuthenticationPrincipal UserDetails userDetails,
                           Model model) {
        if (bindingResult.hasErrors()) {
            return "teams/team_form";
        }

        try {
            if (team.getId() == null) {
                teamService.createTeam(team, userDetails.getUsername());
            } else {
                teamService.updateTeam(team.getId(), team, userDetails.getUsername());
            }
            return "redirect:/teams/my";
        } catch (IllegalArgumentException | DataIntegrityViolationException ex) {
            model.addAttribute("errorMessage", ex.getMessage());
            return "teams/team_form";
        } catch (Exception ex) {
            model.addAttribute("errorMessage", "Không thể lưu đội bóng. Vui lòng kiểm tra lại dữ liệu.");
            return "teams/team_form";
        }
    }

    @GetMapping("/teams/delete/{id}")
    public String deleteTeam(@PathVariable Long id,
                             @AuthenticationPrincipal UserDetails userDetails,
                             RedirectAttributes redirectAttributes) {
        try {
            teamService.deleteTeam(id, userDetails.getUsername());
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa đội bóng thành công.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/teams/my";
    }
}
