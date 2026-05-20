package be.ephec.pdw.backend.site;

import org.springframework.stereotype.Component;

@Component
public class SiteMapper {

    public SiteDTO toDTO(Site site) {
        return new SiteDTO(
                site.getId(),
                site.getName(),
                site.getLocation(),
                site.getOpeningTime(),
                site.getClosingTime()
        );
    }

    public Site toEntity(SiteDTO siteDTO) {
        return Site.builder()
                .id(siteDTO.id())
                .name(siteDTO.name())
                .location(siteDTO.location())
                .openingTime(siteDTO.openingTime())
                .closingTime(siteDTO.closingTime())
                .build();
    }
}