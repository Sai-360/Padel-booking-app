package be.ephec.pdw.backend.reservation;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public List<ReservationDTO> getAllReservations() {
        return reservationService.getAllReservations();
    }

    @GetMapping("/{id}")
    public ReservationDTO getReservationById(@PathVariable UUID id) {
        return reservationService.getReservationById(id);
    }

    @GetMapping("/public")
    public List<ReservationDTO> getPublicReservations() {
        return reservationService.getPublicReservations();
    }

    @GetMapping("/organizer/{organizerId}")
    public List<ReservationDTO> getReservationsByOrganizerId(@PathVariable UUID organizerId) {
        return reservationService.getReservationsByOrganizerId(organizerId);
    }

    @PostMapping
    public ReservationDTO createReservation(@RequestBody ReservationDTO reservationDTO) {
        return reservationService.createReservation(reservationDTO);
    }
}