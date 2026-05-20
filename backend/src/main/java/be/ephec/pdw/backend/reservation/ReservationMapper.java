package be.ephec.pdw.backend.reservation;

import org.springframework.stereotype.Component;

@Component
public class ReservationMapper {

    public ReservationDTO toDTO(Reservation reservation) {
        return new ReservationDTO(
                reservation.getId(),
                reservation.getSiteId(),
                reservation.getCourtId(),
                reservation.getOrganizerId(),
                reservation.getReservationDate(),
                reservation.getStartTime(),
                reservation.getType(),
                reservation.getStatus(),
                reservation.getPrice()
        );
    }

    public Reservation toEntity(ReservationDTO reservationDTO) {
        return Reservation.builder()
                .id(reservationDTO.id())
                .siteId(reservationDTO.siteId())
                .courtId(reservationDTO.courtId())
                .organizerId(reservationDTO.organizerId())
                .reservationDate(reservationDTO.reservationDate())
                .startTime(reservationDTO.startTime())
                .type(reservationDTO.type())
                .status(reservationDTO.status())
                .price(reservationDTO.price())
                .build();
    }
}