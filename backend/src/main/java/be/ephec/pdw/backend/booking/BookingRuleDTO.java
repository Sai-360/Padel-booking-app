package be.ephec.pdw.backend.booking;

import java.math.BigDecimal;

public record BookingRuleDTO(
        BigDecimal matchPrice,
        int maxPlayers,
        int globalBookingLimitDays,
        int siteBookingLimitDays,
        int freeBookingLimitDays,
        BigDecimal penaltyAmountPerMissingPlayer,
        int privatePenaltyBlockDays,
        int penaltyCheckDaysBeforeMatch
) {
}