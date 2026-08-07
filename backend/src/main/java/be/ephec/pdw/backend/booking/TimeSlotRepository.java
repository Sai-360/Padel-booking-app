package be.ephec.pdw.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, UUID> {

    List<TimeSlot> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<TimeSlot> findByStartTimeAndActiveTrue(LocalTime startTime);
}