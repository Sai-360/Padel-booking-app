package be.ephec.pdw.backend.reservation;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class ReservationRepositoryTest {

    @Autowired
    private ReservationRepository reservationRepository;

    private final UUID organizerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID otherOrganizerId = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final UUID siteId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID courtId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Test
    void findByTypeReturnsOnlyPublicReservations() {
        Reservation publicReservation = createReservation(
                UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                organizerId,
                ReservationType.PUBLIC
        );

        Reservation privateReservation = createReservation(
                UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                organizerId,
                ReservationType.PRIVATE
        );

        reservationRepository.save(publicReservation);
        reservationRepository.save(privateReservation);

        List<Reservation> result = reservationRepository.findByType(ReservationType.PUBLIC);

        assertEquals(1, result.size());
        assertEquals(ReservationType.PUBLIC, result.get(0).getType());
        assertEquals(publicReservation.getId(), result.get(0).getId());
    }

    @Test
    void findByOrganizerIdReturnsOnlyOrganizerReservations() {
        Reservation organizerReservation = createReservation(
                UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                organizerId,
                ReservationType.PUBLIC
        );

        Reservation otherReservation = createReservation(
                UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                otherOrganizerId,
                ReservationType.PUBLIC
        );

        reservationRepository.save(organizerReservation);
        reservationRepository.save(otherReservation);

        List<Reservation> result = reservationRepository.findByOrganizerId(organizerId);

        assertEquals(1, result.size());
        assertEquals(organizerId, result.get(0).getOrganizerId());
        assertEquals(organizerReservation.getId(), result.get(0).getId());
    }

    private Reservation createReservation(
            UUID reservationId,
            UUID organizerId,
            ReservationType type
    ) {
        return Reservation.builder()
                .id(reservationId)
                .siteId(siteId)
                .courtId(courtId)
                .organizerId(organizerId)
                .reservationDate(LocalDate.now().plusDays(5))
                .startTime(LocalTime.of(10, 30))
                .type(type)
                .status(ReservationStatus.ACTIVE)
                .price(BigDecimal.valueOf(60))
                .build();
    }
}