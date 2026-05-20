package be.ephec.pdw.backend.reservation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ReservationDTO(
        UUID id,
        UUID siteId,
        UUID courtId,
        UUID organizerId,
        LocalDate reservationDate,
        LocalTime startTime,
        ReservationType type,
        ReservationStatus status,
        BigDecimal price
) {
}