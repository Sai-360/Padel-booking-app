package be.ephec.pdw.backend.admin;

import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import be.ephec.pdw.backend.member.AdminRole;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.reservation.ReservationDTO;
import be.ephec.pdw.backend.reservation.ReservationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final ReservationService reservationService;
    private final MemberRepository memberRepository;

    public AdminController(
            ReservationService reservationService,
            MemberRepository memberRepository
    ) {
        this.reservationService = reservationService;
        this.memberRepository = memberRepository;
    }

    @GetMapping("/reservations")
    public List<ReservationDTO> getAdminReservations() {
        Member currentAdmin = getCurrentAdmin();

        List<ReservationDTO> reservations = reservationService.getAllReservations(currentAdmin.getId());

        if (currentAdmin.getAdminRole() == AdminRole.SITE_ADMIN) {
            return reservations.stream()
                    .filter(reservation -> reservation.siteId().toString().equals(currentAdmin.getSiteId()))
                    .toList();
        }

        return reservations;
    }

    @GetMapping("/members")
    public List<AdminMemberDTO> getAdminMembers() {
        Member currentAdmin = getCurrentAdmin();

        List<Member> members = memberRepository.findAll();

        if (currentAdmin.getAdminRole() == AdminRole.SITE_ADMIN) {
            members = members.stream()
                    .filter(member -> currentAdmin.getSiteId() != null
                            && currentAdmin.getSiteId().equals(member.getSiteId()))
                    .toList();
        }

        return members.stream()
                .map(member -> new AdminMemberDTO(
                        member.getId(),
                        member.getMatricule(),
                        member.getName(),
                        member.getType(),
                        member.getSiteId(),
                        member.getUnpaidBalance(),
                        member.getBlockedUntil(),
                        member.getAdminRole()
                ))
                .toList();
    }

    private Member getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new BusinessException("Admin access required.");
        }

        UUID memberId = UUID.fromString(authentication.getPrincipal().toString());

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin member not found."));

        if (member.getAdminRole() == null || member.getAdminRole() == AdminRole.NONE) {
            throw new BusinessException("Admin access required.");
        }

        return member;
    }
}