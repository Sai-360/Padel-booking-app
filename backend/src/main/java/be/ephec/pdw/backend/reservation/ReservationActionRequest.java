package be.ephec.pdw.backend.reservation;

import java.util.UUID;

public record ReservationActionRequest(
        UUID memberId
) {
}