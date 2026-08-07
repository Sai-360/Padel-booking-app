package be.ephec.pdw.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.UUID;

public interface ClosedDayRepository extends JpaRepository<ClosedDay, UUID> {

    boolean existsByActiveTrueAndSiteIdIsNullAndClosedDate(LocalDate closedDate);

    boolean existsByActiveTrueAndSiteIdAndClosedDate(UUID siteId, LocalDate closedDate);
}