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
    public List<ReservationDTO> getAllReservations(
            @RequestParam(required = false) UUID currentUserId
    ) {
        return reservationService.getAllReservations(currentUserId);
    }

    @GetMapping("/{id}")
    public ReservationDTO getReservationById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID currentUserId
    ) {
        return reservationService.getReservationById(id, currentUserId);
    }

    @GetMapping("/public")
    public List<ReservationDTO> getPublicReservations(
            @RequestParam(required = false) UUID currentUserId
    ) {
        return reservationService.getPublicReservations(currentUserId);
    }

    @GetMapping("/organizer/{organizerId}")
    public List<ReservationDTO> getReservationsByOrganizerId(
            @PathVariable UUID organizerId,
            @RequestParam(required = false) UUID currentUserId
    ) {
        return reservationService.getReservationsByOrganizerId(organizerId, currentUserId);
    }

    @GetMapping("/member/{memberId}")
    public List<ReservationDTO> getReservationsByMemberId(@PathVariable UUID memberId) {
        return reservationService.getReservationsByMemberId(memberId);
    }

    @PostMapping
    public ReservationDTO createReservation(@RequestBody ReservationDTO reservationDTO) {
        return reservationService.createReservation(reservationDTO);
    }

    @PostMapping("/{id}/join")
    public ParticipationDTO joinReservation(
            @PathVariable UUID id,
            @RequestBody ReservationActionRequest request
    ) {
        return reservationService.joinReservation(id, request.memberId());
    }

    @PostMapping("/{id}/pay")
    public ParticipationDTO payReservation(
            @PathVariable UUID id,
            @RequestBody ReservationActionRequest request
    ) {
        return reservationService.payReservation(id, request.memberId());
    }

    @PostMapping("/{id}/apply-penalty")
    public ReservationDTO applyPenaltyForIncompletePrivateReservation(@PathVariable UUID id) {
        return reservationService.applyPenaltyForIncompletePrivateReservation(id);
    }}