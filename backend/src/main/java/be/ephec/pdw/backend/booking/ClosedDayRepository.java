package be.ephec.pdw.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ClosedDayRepository extends JpaRepository<ClosedDay, UUID> {

    boolean existsByActiveTrueAndSiteIdIsNullAndClosedDate(LocalDate closedDate);

    boolean existsByActiveTrueAndSiteIdAndClosedDate(UUID siteId, LocalDate closedDate);

    List<ClosedDay> findByActiveTrueAndSiteIdIsNull();

    List<ClosedDay> findByActiveTrueAndSiteId(UUID siteId);
}