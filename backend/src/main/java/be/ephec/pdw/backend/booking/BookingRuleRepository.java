package be.ephec.pdw.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BookingRuleRepository extends JpaRepository<BookingRule, UUID> {

    Optional<BookingRule> findFirstByOrderByIdAsc();
}