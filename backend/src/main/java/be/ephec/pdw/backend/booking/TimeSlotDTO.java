package be.ephec.pdw.backend.booking;

import java.time.LocalTime;
import java.util.UUID;

public record TimeSlotDTO(
        UUID id,
        LocalTime startTime,
        LocalTime endTime,
        String label
) {
}