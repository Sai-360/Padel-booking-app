package be.ephec.pdw.backend.site;

import java.time.LocalTime;
import java.util.UUID;

public record SiteDTO(
        UUID id,
        String name,
        String location,
        LocalTime openingTime,
        LocalTime closingTime
) {
}