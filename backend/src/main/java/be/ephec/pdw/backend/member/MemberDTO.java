package be.ephec.pdw.backend.member;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MemberDTO(
        UUID id,
        String matricule,
        String name,
        MemberType type,
        String siteId,
        BigDecimal unpaidBalance,
        LocalDate blockedUntil
) {
}