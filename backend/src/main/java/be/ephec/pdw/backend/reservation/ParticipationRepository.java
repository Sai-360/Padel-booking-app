package be.ephec.pdw.backend.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParticipationRepository extends JpaRepository<Participation, UUID> {

    List<Participation> findByReservationId(UUID reservationId);

    List<Participation> findByMemberId(UUID memberId);

    Optional<Participation> findByReservationIdAndMemberId(UUID reservationId, UUID memberId);

    boolean existsByReservationIdAndMemberId(UUID reservationId, UUID memberId);

    long countByReservationId(UUID reservationId);
}