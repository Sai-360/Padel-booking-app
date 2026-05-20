package be.ephec.pdw.backend.court;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CourtService {

    private final CourtRepository courtRepository;
    private final CourtMapper courtMapper;

    public CourtService(CourtRepository courtRepository, CourtMapper courtMapper) {
        this.courtRepository = courtRepository;
        this.courtMapper = courtMapper;
    }

    public List<CourtDTO> getAllCourts() {
        return courtRepository.findAll()
                .stream()
                .map(courtMapper::toDTO)
                .toList();
    }

    public CourtDTO getCourtById(UUID id) {
        return courtRepository.findById(id)
                .map(courtMapper::toDTO)
                .orElseThrow();
    }

    public List<CourtDTO> getCourtsBySiteId(UUID siteId) {
        return courtRepository.findBySiteId(siteId)
                .stream()
                .map(courtMapper::toDTO)
                .toList();
    }

    public CourtDTO createCourt(CourtDTO courtDTO) {
        Court court = courtMapper.toEntity(courtDTO);
        Court savedCourt = courtRepository.save(court);

        return courtMapper.toDTO(savedCourt);
    }
}