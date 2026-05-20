package be.ephec.pdw.backend.site;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final SiteMapper siteMapper;

    public SiteService(SiteRepository siteRepository, SiteMapper siteMapper) {
        this.siteRepository = siteRepository;
        this.siteMapper = siteMapper;
    }

    public List<SiteDTO> getAllSites() {
        return siteRepository.findAll()
                .stream()
                .map(siteMapper::toDTO)
                .toList();
    }

    public SiteDTO getSiteById(UUID id) {
        return siteRepository.findById(id)
                .map(siteMapper::toDTO)
                .orElseThrow();
    }

    public SiteDTO createSite(SiteDTO siteDTO) {
        Site site = siteMapper.toEntity(siteDTO);
        Site savedSite = siteRepository.save(site);

        return siteMapper.toDTO(savedSite);
    }
}