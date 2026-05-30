package be.ephec.pdw.backend.admin;

import be.ephec.pdw.backend.member.AdminRole;
import be.ephec.pdw.backend.member.MemberType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AdminMemberDTO(
        UUID id,
        String matricule,
        String name,
        MemberType type,
        String siteId,
        BigDecimal unpaidBalance,
        LocalDate blockedUntil,
        AdminRole adminRole
) {
}