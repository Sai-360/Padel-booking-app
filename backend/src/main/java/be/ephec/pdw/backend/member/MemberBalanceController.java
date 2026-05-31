package be.ephec.pdw.backend.member;

import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/members")
public class MemberBalanceController {

    private final MemberRepository memberRepository;

    public MemberBalanceController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @PostMapping("/{id}/pay-balance")
    public MemberDTO payBalance(@PathVariable UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found."));

        member.setUnpaidBalance(BigDecimal.ZERO);

        Member savedMember = memberRepository.save(member);

        return new MemberDTO(
                savedMember.getId(),
                savedMember.getMatricule(),
                savedMember.getName(),
                savedMember.getType(),
                savedMember.getSiteId(),
                savedMember.getUnpaidBalance(),
                savedMember.getBlockedUntil(),
                savedMember.getAdminRole()
        );
    }
}