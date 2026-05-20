package be.ephec.pdw.backend.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    List<Reservation> findByType(ReservationType type);

    List<Reservation> findByOrganizerId(UUID organizerId);
}