package be.ephec.pdw.backend.reservation;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;

    public ReservationService(ReservationRepository reservationRepository, ReservationMapper reservationMapper) {
        this.reservationRepository = reservationRepository;
        this.reservationMapper = reservationMapper;
    }

    public List<ReservationDTO> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public ReservationDTO getReservationById(UUID id) {
        return reservationRepository.findById(id)
                .map(reservationMapper::toDTO)
                .orElseThrow();
    }

    public List<ReservationDTO> getPublicReservations() {
        return reservationRepository.findByType(ReservationType.PUBLIC)
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public List<ReservationDTO> getReservationsByOrganizerId(UUID organizerId) {
        return reservationRepository.findByOrganizerId(organizerId)
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        Reservation reservation = reservationMapper.toEntity(reservationDTO);
        Reservation savedReservation = reservationRepository.save(reservation);

        return reservationMapper.toDTO(savedReservation);
    }
}