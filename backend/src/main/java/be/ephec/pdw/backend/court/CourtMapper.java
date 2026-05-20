package be.ephec.pdw.backend.court;

import org.springframework.stereotype.Component;

@Component
public class CourtMapper {

    public CourtDTO toDTO(Court court) {
        return new CourtDTO(
                court.getId(),
                court.getName(),
                court.getSiteId(),
                court.isActive()
        );
    }

    public Court toEntity(CourtDTO courtDTO) {
        return Court.builder()
                .id(courtDTO.id())
                .name(courtDTO.name())
                .siteId(courtDTO.siteId())
                .active(courtDTO.active())
                .build();
    }
}