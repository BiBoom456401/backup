package com.example.DACK.controller;

import com.example.DACK.model.TeamMember;
import com.example.DACK.service.TeamMemberService;
import com.example.DACK.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class TeamMemberController {
    private final TeamMemberService teamMemberService;
    private final TeamService teamService;

    @GetMapping("/teams/{teamId}/members")
    public String teamMembers(@PathVariable Long teamId,
                              @AuthenticationPrincipal UserDetails userDetails,
                              Model model) {
        model.addAttribute("team", teamService.getOwnedTeam(teamId, userDetails.getUsername()));
        model.addAttribute("members", teamMemberService.getMembersByTeam(teamId, userDetails.getUsername()));
        model.addAttribute("registrations", teamMemberService.getRegistrationsByTeam(teamId, userDetails.getUsername()));
        model.addAttribute("memberCount", teamMemberService.countMembers(teamId));
        return "teams/team_members";
    }

    @GetMapping("/teams/{teamId}/members/add")
    public String addMemberForm(@PathVariable Long teamId,
                                @AuthenticationPrincipal UserDetails userDetails,
                                Model model) {
        model.addAttribute("team", teamService.getOwnedTeam(teamId, userDetails.getUsername()));
        model.addAttribute("member", new TeamMember());
        return "teams/member_form";
    }

    @GetMapping("/teams/{teamId}/members/edit/{memberId}")
    public String editMemberForm(@PathVariable Long teamId,
                                 @PathVariable Long memberId,
                                 @AuthenticationPrincipal UserDetails userDetails,
                                 Model model) {
        model.addAttribute("team", teamService.getOwnedTeam(teamId, userDetails.getUsername()));
        model.addAttribute("member", teamMemberService.getOwnedMember(teamId, memberId, userDetails.getUsername()));
        return "teams/member_form";
    }

    @PostMapping("/teams/{teamId}/members/save")
    public String saveMember(@PathVariable Long teamId,
                             @Valid @ModelAttribute("member") TeamMember member,
                             BindingResult bindingResult,
                             @AuthenticationPrincipal UserDetails userDetails,
                             Model model) {
        model.addAttribute("team", teamService.getOwnedTeam(teamId, userDetails.getUsername()));

        if (bindingResult.hasErrors()) {
            return "teams/member_form";
        }

        try {
            if (member.getId() == null) {
                teamMemberService.createMember(teamId, member, userDetails.getUsername());
            } else {
                teamMemberService.updateMember(teamId, member.getId(), member, userDetails.getUsername());
            }
            return "redirect:/teams/" + teamId + "/members";
        } catch (IllegalArgumentException ex) {
            model.addAttribute("errorMessage", ex.getMessage());
            return "teams/member_form";
        }
    }

    @GetMapping("/teams/{teamId}/members/delete/{memberId}")
    public String deleteMember(@PathVariable Long teamId,
                               @PathVariable Long memberId,
                               @AuthenticationPrincipal UserDetails userDetails,
                               RedirectAttributes redirectAttributes) {
        try {
            teamMemberService.deleteMember(teamId, memberId, userDetails.getUsername());
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa thành viên.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
        }
        return "redirect:/teams/" + teamId + "/members";
    }
}
