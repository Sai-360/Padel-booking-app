package be.ephec.pdw.backend.config;

import be.ephec.pdw.backend.booking.BookingRule;
import be.ephec.pdw.backend.booking.BookingRuleRepository;
import be.ephec.pdw.backend.booking.ClosedDay;
import be.ephec.pdw.backend.booking.ClosedDayRepository;
import be.ephec.pdw.backend.booking.TimeSlot;
import be.ephec.pdw.backend.booking.TimeSlotRepository;
import be.ephec.pdw.backend.court.Court;
import be.ephec.pdw.backend.court.CourtRepository;
import be.ephec.pdw.backend.member.AdminRole;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.member.MemberType;
import be.ephec.pdw.backend.reservation.Participation;
import be.ephec.pdw.backend.reservation.ParticipationRepository;
import be.ephec.pdw.backend.reservation.ParticipationRole;
import be.ephec.pdw.backend.reservation.ParticipationStatus;
import be.ephec.pdw.backend.reservation.Reservation;
import be.ephec.pdw.backend.reservation.ReservationRepository;
import be.ephec.pdw.backend.reservation.ReservationStatus;
import be.ephec.pdw.backend.reservation.ReservationType;
import be.ephec.pdw.backend.site.Site;
import be.ephec.pdw.backend.site.SiteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final UUID GLOBAL_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_USER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID SITE_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID FREE_USER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID DEBT_USER_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

    private static final UUID SITE_BRUSSELS_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID SITE_NAMUR_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static final UUID BRUSSELS_COURT_1_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID BRUSSELS_COURT_2_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static final UUID NAMUR_COURT_1_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");
    private static final UUID NAMUR_COURT_2_ID = UUID.fromString("77777777-7777-7777-7777-777777777777");

    private static final UUID PUBLIC_RESERVATION_ID = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static final UUID PRIVATE_RESERVATION_ID = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");

    private static final UUID BOOKING_RULE_ID = UUID.fromString("99999999-9999-9999-9999-999999999999");

    private static final UUID TIME_SLOT_1_ID = UUID.fromString("90000000-0000-0000-0000-000000000001");
    private static final UUID TIME_SLOT_2_ID = UUID.fromString("90000000-0000-0000-0000-000000000002");
    private static final UUID TIME_SLOT_3_ID = UUID.fromString("90000000-0000-0000-0000-000000000003");
    private static final UUID TIME_SLOT_4_ID = UUID.fromString("90000000-0000-0000-0000-000000000004");
    private static final UUID TIME_SLOT_5_ID = UUID.fromString("90000000-0000-0000-0000-000000000005");
    private static final UUID TIME_SLOT_6_ID = UUID.fromString("90000000-0000-0000-0000-000000000006");

    private static final UUID GLOBAL_CLOSED_DAY_1_ID = UUID.fromString("91000000-0000-0000-0000-000000000001");
    private static final UUID GLOBAL_CLOSED_DAY_2_ID = UUID.fromString("91000000-0000-0000-0000-000000000002");
    private static final UUID BRUSSELS_CLOSED_DAY_ID = UUID.fromString("91000000-0000-0000-0000-000000000003");
    private static final UUID NAMUR_CLOSED_DAY_ID = UUID.fromString("91000000-0000-0000-0000-000000000004");

    private final MemberRepository memberRepository;
    private final SiteRepository siteRepository;
    private final CourtRepository courtRepository;
    private final ReservationRepository reservationRepository;
    private final ParticipationRepository participationRepository;
    private final BookingRuleRepository bookingRuleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ClosedDayRepository closedDayRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            MemberRepository memberRepository,
            SiteRepository siteRepository,
            CourtRepository courtRepository,
            ReservationRepository reservationRepository,
            ParticipationRepository participationRepository,
            BookingRuleRepository bookingRuleRepository,
            TimeSlotRepository timeSlotRepository,
            ClosedDayRepository closedDayRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.memberRepository = memberRepository;
        this.siteRepository = siteRepository;
        this.courtRepository = courtRepository;
        this.reservationRepository = reservationRepository;
        this.participationRepository = participationRepository;
        this.bookingRuleRepository = bookingRuleRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.closedDayRepository = closedDayRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedMembers();
        seedSites();
        seedCourts();
        seedBookingRules();
        seedTimeSlots();
        seedClosedDays();
        seedReservations();
        seedParticipations();
    }

    private void seedMembers() {
        if (!memberRepository.existsById(GLOBAL_USER_ID)) {
            memberRepository.save(
                    Member.builder()
                            .id(GLOBAL_USER_ID)
                            .matricule("G0001")
                            .name("Global Admin")
                            .type(MemberType.GLOBAL)
                            .siteId(null)
                            .unpaidBalance(BigDecimal.ZERO)
                            .blockedUntil(null)
                            .adminRole(AdminRole.GLOBAL_ADMIN)
                            .adminPassword(passwordEncoder.encode("admin123"))
                            .build()
            );
        }

        if (!memberRepository.existsById(DEBT_USER_ID)) {
            memberRepository.save(
                    Member.builder()
                            .id(DEBT_USER_ID)
                            .matricule("G0003")
                            .name("Global Member With Debt")
                            .type(MemberType.GLOBAL)
                            .siteId(null)
                            .unpaidBalance(BigDecimal.valueOf(15))
                            .blockedUntil(null)
                            .adminRole(AdminRole.NONE)
                            .adminPassword(null)
                            .build()
            );
        }

        if (!memberRepository.existsById(OTHER_USER_ID)) {
            memberRepository.save(
                    Member.builder()
                            .id(OTHER_USER_ID)
                            .matricule("G0002")
                            .name("Other Global Member")
                            .type(MemberType.GLOBAL)
                            .siteId(null)
                            .unpaidBalance(BigDecimal.ZERO)
                            .blockedUntil(null)
                            .adminRole(AdminRole.NONE)
                            .adminPassword(null)
                            .build()
            );
        }

        if (!memberRepository.existsById(SITE_USER_ID)) {
            memberRepository.save(
                    Member.builder()
                            .id(SITE_USER_ID)
                            .matricule("S0001")
                            .name("Site Admin Brussels")
                            .type(MemberType.SITE)
                            .siteId(SITE_BRUSSELS_ID.toString())
                            .unpaidBalance(BigDecimal.ZERO)
                            .blockedUntil(null)
                            .adminRole(AdminRole.SITE_ADMIN)
                            .adminPassword(passwordEncoder.encode("site123"))
                            .build()
            );
        }

        if (!memberRepository.existsById(FREE_USER_ID)) {
            memberRepository.save(
                    Member.builder()
                            .id(FREE_USER_ID)
                            .matricule("L0001")
                            .name("Free Member")
                            .type(MemberType.FREE)
                            .siteId(null)
                            .unpaidBalance(BigDecimal.ZERO)
                            .blockedUntil(null)
                            .adminRole(AdminRole.NONE)
                            .adminPassword(null)
                            .build()
            );
        }
    }

    private void seedSites() {
        if (!siteRepository.existsById(SITE_BRUSSELS_ID)) {
            siteRepository.save(
                    Site.builder()
                            .id(SITE_BRUSSELS_ID)
                            .name("Padel Brussels")
                            .location("Brussels")
                            .openingTime(LocalTime.of(8, 0))
                            .closingTime(LocalTime.of(22, 0))
                            .build()
            );
        }

        if (!siteRepository.existsById(SITE_NAMUR_ID)) {
            siteRepository.save(
                    Site.builder()
                            .id(SITE_NAMUR_ID)
                            .name("Padel Namur")
                            .location("Namur")
                            .openingTime(LocalTime.of(9, 0))
                            .closingTime(LocalTime.of(21, 0))
                            .build()
            );
        }
    }

    private void seedCourts() {
        if (!courtRepository.existsById(BRUSSELS_COURT_1_ID)) {
            courtRepository.save(
                    Court.builder()
                            .id(BRUSSELS_COURT_1_ID)
                            .name("Court 1")
                            .siteId(SITE_BRUSSELS_ID)
                            .active(true)
                            .build()
            );
        }

        if (!courtRepository.existsById(BRUSSELS_COURT_2_ID)) {
            courtRepository.save(
                    Court.builder()
                            .id(BRUSSELS_COURT_2_ID)
                            .name("Court 2")
                            .siteId(SITE_BRUSSELS_ID)
                            .active(true)
                            .build()
            );
        }

        if (!courtRepository.existsById(NAMUR_COURT_1_ID)) {
            courtRepository.save(
                    Court.builder()
                            .id(NAMUR_COURT_1_ID)
                            .name("Court 1")
                            .siteId(SITE_NAMUR_ID)
                            .active(true)
                            .build()
            );
        }

        if (!courtRepository.existsById(NAMUR_COURT_2_ID)) {
            courtRepository.save(
                    Court.builder()
                            .id(NAMUR_COURT_2_ID)
                            .name("Court 2")
                            .siteId(SITE_NAMUR_ID)
                            .active(true)
                            .build()
            );
        }
    }

    private void seedBookingRules() {
        if (!bookingRuleRepository.existsById(BOOKING_RULE_ID)) {
            bookingRuleRepository.save(
                    BookingRule.builder()
                            .id(BOOKING_RULE_ID)
                            .matchPrice(BigDecimal.valueOf(60))
                            .maxPlayers(4)
                            .globalBookingLimitDays(21)
                            .siteBookingLimitDays(14)
                            .freeBookingLimitDays(5)
                            .penaltyAmountPerMissingPlayer(BigDecimal.valueOf(15))
                            .privatePenaltyBlockDays(7)
                            .penaltyCheckDaysBeforeMatch(1)
                            .build()
            );
        }
    }

    private void seedTimeSlots() {
        seedTimeSlotIfMissing(TIME_SLOT_1_ID, LocalTime.of(9, 0), LocalTime.of(10, 30), 1);
        seedTimeSlotIfMissing(TIME_SLOT_2_ID, LocalTime.of(10, 45), LocalTime.of(12, 15), 2);
        seedTimeSlotIfMissing(TIME_SLOT_3_ID, LocalTime.of(12, 30), LocalTime.of(14, 0), 3);
        seedTimeSlotIfMissing(TIME_SLOT_4_ID, LocalTime.of(14, 15), LocalTime.of(15, 45), 4);
        seedTimeSlotIfMissing(TIME_SLOT_5_ID, LocalTime.of(16, 0), LocalTime.of(17, 30), 5);
        seedTimeSlotIfMissing(TIME_SLOT_6_ID, LocalTime.of(17, 45), LocalTime.of(19, 15), 6);
    }

    private void seedTimeSlotIfMissing(
            UUID id,
            LocalTime startTime,
            LocalTime endTime,
            int displayOrder
    ) {
        if (timeSlotRepository.existsById(id)) {
            return;
        }

        timeSlotRepository.save(
                TimeSlot.builder()
                        .id(id)
                        .startTime(startTime)
                        .endTime(endTime)
                        .displayOrder(displayOrder)
                        .active(true)
                        .build()
        );
    }

    private void seedClosedDays() {
        seedClosedDayIfMissing(
                GLOBAL_CLOSED_DAY_1_ID,
                null,
                LocalDate.of(2026, 1, 1),
                "New year"
        );

        seedClosedDayIfMissing(
                GLOBAL_CLOSED_DAY_2_ID,
                null,
                LocalDate.of(2026, 12, 25),
                "Christmas"
        );

        seedClosedDayIfMissing(
                BRUSSELS_CLOSED_DAY_ID,
                SITE_BRUSSELS_ID,
                LocalDate.of(2026, 6, 20),
                "Brussels maintenance"
        );

        seedClosedDayIfMissing(
                NAMUR_CLOSED_DAY_ID,
                SITE_NAMUR_ID,
                LocalDate.of(2026, 6, 15),
                "Namur maintenance"
        );
    }

    private void seedClosedDayIfMissing(
            UUID id,
            UUID siteId,
            LocalDate closedDate,
            String reason
    ) {
        if (closedDayRepository.existsById(id)) {
            return;
        }

        closedDayRepository.save(
                ClosedDay.builder()
                        .id(id)
                        .siteId(siteId)
                        .closedDate(closedDate)
                        .reason(reason)
                        .active(true)
                        .build()
        );
    }

    private void seedReservations() {
        if (!reservationRepository.existsById(PUBLIC_RESERVATION_ID)) {
            reservationRepository.save(
                    Reservation.builder()
                            .id(PUBLIC_RESERVATION_ID)
                            .siteId(SITE_BRUSSELS_ID)
                            .courtId(BRUSSELS_COURT_1_ID)
                            .organizerId(OTHER_USER_ID)
                            .reservationDate(LocalDate.now().plusDays(5))
                            .startTime(LocalTime.of(10, 45))
                            .type(ReservationType.PUBLIC)
                            .status(ReservationStatus.ACTIVE)
                            .price(BigDecimal.valueOf(60))
                            .build()
            );
        }

        if (!reservationRepository.existsById(PRIVATE_RESERVATION_ID)) {
            reservationRepository.save(
                    Reservation.builder()
                            .id(PRIVATE_RESERVATION_ID)
                            .siteId(SITE_BRUSSELS_ID)
                            .courtId(BRUSSELS_COURT_2_ID)
                            .organizerId(GLOBAL_USER_ID)
                            .reservationDate(LocalDate.now().plusDays(6))
                            .startTime(LocalTime.of(12, 30))
                            .type(ReservationType.PRIVATE)
                            .status(ReservationStatus.ACTIVE)
                            .price(BigDecimal.valueOf(60))
                            .build()
            );
        }
    }

    private void seedParticipations() {
        seedOrganizerParticipationIfMissing(
                PUBLIC_RESERVATION_ID,
                OTHER_USER_ID,
                "Other Global Member"
        );

        seedOrganizerParticipationIfMissing(
                PRIVATE_RESERVATION_ID,
                GLOBAL_USER_ID,
                "Global Admin"
        );
    }

    private void seedOrganizerParticipationIfMissing(
            UUID reservationId,
            UUID memberId,
            String memberName
    ) {
        if (participationRepository.existsByReservationIdAndMemberId(reservationId, memberId)) {
            return;
        }

        participationRepository.save(
                Participation.builder()
                        .id(UUID.randomUUID())
                        .reservationId(reservationId)
                        .memberId(memberId)
                        .memberName(memberName)
                        .role(ParticipationRole.ORGANIZER)
                        .paid(false)
                        .status(ParticipationStatus.PENDING)
                        .build()
        );
    }
}