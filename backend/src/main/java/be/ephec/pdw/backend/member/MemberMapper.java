package be.ephec.pdw.backend.member;

import org.springframework.stereotype.Component;

@Component
public class MemberMapper {

    public MemberDTO toDTO(Member member) {
        return new MemberDTO(
                member.getId(),
                member.getMatricule(),
                member.getName(),
                member.getType(),
                member.getSiteId(),
                member.getUnpaidBalance(),
                member.getBlockedUntil(),
                member.getAdminRole()
        );
    }
    public Member toEntity(MemberDTO memberDTO) {
        return Member.builder()
                .id(memberDTO.id())
                .matricule(memberDTO.matricule())
                .name(memberDTO.name())
                .type(memberDTO.type())
                .siteId(memberDTO.siteId())
                .unpaidBalance(memberDTO.unpaidBalance())
                .blockedUntil(memberDTO.blockedUntil())
                .build();
    }
}