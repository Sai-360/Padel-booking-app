package be.ephec.pdw.backend.court;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/courts")
public class CourtController {

    private final CourtService courtService;

    public CourtController(CourtService courtService) {
        this.courtService = courtService;
    }

    @GetMapping
    public List<CourtDTO> getAllCourts() {
        return courtService.getAllCourts();
    }

    @GetMapping("/{id}")
    public CourtDTO getCourtById(@PathVariable UUID id) {
        return courtService.getCourtById(id);
    }

    @GetMapping("/site/{siteId}")
    public List<CourtDTO> getCourtsBySiteId(@PathVariable UUID siteId) {
        return courtService.getCourtsBySiteId(siteId);
    }

    @PostMapping
    public CourtDTO createCourt(@RequestBody CourtDTO courtDTO) {
        return courtService.createCourt(courtDTO);
    }
}