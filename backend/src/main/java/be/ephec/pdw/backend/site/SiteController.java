package be.ephec.pdw.backend.site;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public List<SiteDTO> getAllSites() {
        return siteService.getAllSites();
    }

    @GetMapping("/{id}")
    public SiteDTO getSiteById(@PathVariable UUID id) {
        return siteService.getSiteById(id);
    }

    @PostMapping
    public SiteDTO createSite(@RequestBody SiteDTO siteDTO) {
        return siteService.createSite(siteDTO);
    }
}