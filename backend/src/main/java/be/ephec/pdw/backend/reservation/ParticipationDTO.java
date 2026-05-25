package be.ephec.pdw.backend.reservation;

import java.util.UUID;

public record ParticipationDTO(
        UUID id,
        UUID reservationId,
        UUID memberId,
        String memberName,
        ParticipationRole role,
        boolean paid,
        ParticipationStatus status
) {
}