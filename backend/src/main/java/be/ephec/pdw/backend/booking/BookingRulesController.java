package be.ephec.pdw.backend.booking;

import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import be.ephec.pdw.backend.site.Site;
import be.ephec.pdw.backend.site.SiteRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/booking-rules")
public class BookingRulesController {

    private final BookingRuleRepository bookingRuleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ClosedDayRepository closedDayRepository;
    private final SiteRepository siteRepository;

    public BookingRulesController(
            BookingRuleRepository bookingRuleRepository,
            TimeSlotRepository timeSlotRepository,
            ClosedDayRepository closedDayRepository,
            SiteRepository siteRepository
    ) {
        this.bookingRuleRepository = bookingRuleRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.closedDayRepository = closedDayRepository;
        this.siteRepository = siteRepository;
    }

    @GetMapping
    public BookingRuleDTO getBookingRules() {
        BookingRule rule = bookingRuleRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Booking rules not found."));

        return new BookingRuleDTO(
                rule.getMatchPrice(),
                rule.getMaxPlayers(),
                rule.getGlobalBookingLimitDays(),
                rule.getSiteBookingLimitDays(),
                rule.getFreeBookingLimitDays(),
                rule.getPenaltyAmountPerMissingPlayer(),
                rule.getPrivatePenaltyBlockDays(),
                rule.getPenaltyCheckDaysBeforeMatch()
        );
    }

    @GetMapping("/time-slots")
    public List<TimeSlotDTO> getTimeSlotsForSite(@RequestParam UUID siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));

        return timeSlotRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .filter(slot -> !slot.getStartTime().isBefore(site.getOpeningTime()))
                .filter(slot -> !slot.getEndTime().isAfter(site.getClosingTime()))
                .map(slot -> new TimeSlotDTO(
                        slot.getId(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        slot.getStartTime() + " - " + slot.getEndTime()
                ))
                .toList();
    }

    @GetMapping("/closed-days")
    public List<LocalDate> getClosedDaysForSite(@RequestParam UUID siteId) {
        siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));

        List<LocalDate> globalClosedDays = closedDayRepository.findByActiveTrueAndSiteIdIsNull()
                .stream()
                .map(ClosedDay::getClosedDate)
                .toList();

        List<LocalDate> siteClosedDays = closedDayRepository.findByActiveTrueAndSiteId(siteId)
                .stream()
                .map(ClosedDay::getClosedDate)
                .toList();

        return Stream.concat(globalClosedDays.stream(), siteClosedDays.stream())
                .distinct()
                .sorted()
                .toList();
    }
}