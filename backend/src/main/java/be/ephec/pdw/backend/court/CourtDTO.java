package be.ephec.pdw.backend.court;

import java.util.UUID;

public record CourtDTO(
        UUID id,
        String name,
        UUID siteId,
        boolean active
) {
}