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

    private static final UUID GLOBAL_ADMIN_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID GLOBAL_MEMBER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID GLOBAL_DEBT_MEMBER_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

    private static final UUID SITE_BRUSSELS_ADMIN_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID SITE_NAMUR_MEMBER_ID = UUID.fromString("88888888-8888-8888-8888-888888888888");

    private static final UUID FREE_MEMBER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID FREE_BLOCKED_MEMBER_ID = UUID.fromString("99999998-9998-9998-9998-999999999998");

    private static final UUID SITE_BRUSSELS_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID SITE_NAMUR_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static final UUID BRUSSELS_COURT_1_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID BRUSSELS_COURT_2_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static final UUID NAMUR_COURT_1_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");
    private static final UUID NAMUR_COURT_2_ID = UUID.fromString("77777777-7777-7777-7777-777777777777");

    private static final UUID PUBLIC_BRUSSELS_RESERVATION_ID = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static final UUID PRIVATE_BRUSSELS_RESERVATION_ID = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");
    private static final UUID PUBLIC_NAMUR_RESERVATION_ID = UUID.fromString("12121212-1212-1212-1212-121212121212");

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
        seedMemberIfMissing(
                GLOBAL_ADMIN_ID,
                "G0001",
                "Global Admin",
                MemberType.GLOBAL,
                null,
                BigDecimal.ZERO,
                null,
                AdminRole.GLOBAL_ADMIN,
                "admin123"
        );

        seedMemberIfMissing(
                GLOBAL_MEMBER_ID,
                "G0002",
                "Other Global Member",
                MemberType.GLOBAL,
                null,
                BigDecimal.ZERO,
                null,
                AdminRole.NONE,
                null
        );

        seedMemberIfMissing(
                GLOBAL_DEBT_MEMBER_ID,
                "G0003",
                "Global Member With Debt",
                MemberType.GLOBAL,
                null,
                BigDecimal.valueOf(15),
                null,
                AdminRole.NONE,
                null
        );

        seedMemberIfMissing(
                SITE_BRUSSELS_ADMIN_ID,
                "S0001",
                "Site Admin Brussels",
                MemberType.SITE,
                SITE_BRUSSELS_ID.toString(),
                BigDecimal.ZERO,
                null,
                AdminRole.SITE_ADMIN,
                "site123"
        );

        seedMemberIfMissing(
                SITE_NAMUR_MEMBER_ID,
                "S0002",
                "Site Member Namur",
                MemberType.SITE,
                SITE_NAMUR_ID.toString(),
                BigDecimal.ZERO,
                null,
                AdminRole.NONE,
                null
        );

        seedMemberIfMissing(
                FREE_MEMBER_ID,
                "L0001",
                "Free Member",
                MemberType.FREE,
                null,
                BigDecimal.ZERO,
                null,
                AdminRole.NONE,
                null
        );

        seedMemberIfMissing(
                FREE_BLOCKED_MEMBER_ID,
                "L0002",
                "Blocked Free Member",
                MemberType.FREE,
                null,
                BigDecimal.ZERO,
                LocalDate.now().plusDays(7),
                AdminRole.NONE,
                null
        );
    }

    private void seedMemberIfMissing(
            UUID id,
            String matricule,
            String name,
            MemberType type,
            String siteId,
            BigDecimal unpaidBalance,
            LocalDate blockedUntil,
            AdminRole adminRole,
            String rawAdminPassword
    ) {
        if (memberRepository.existsById(id)) {
            return;
        }

        memberRepository.save(
                Member.builder()
                        .id(id)
                        .matricule(matricule)
                        .name(name)
                        .type(type)
                        .siteId(siteId)
                        .unpaidBalance(unpaidBalance)
                        .blockedUntil(blockedUntil)
                        .adminRole(adminRole)
                        .adminPassword(rawAdminPassword == null ? null : passwordEncoder.encode(rawAdminPassword))
                        .build()
        );
    }

    private void seedSites() {
        seedSiteIfMissing(
                SITE_BRUSSELS_ID,
                "Padel Brussels",
                "Brussels",
                LocalTime.of(8, 0),
                LocalTime.of(22, 0)
        );

        seedSiteIfMissing(
                SITE_NAMUR_ID,
                "Padel Namur",
                "Namur",
                LocalTime.of(9, 0),
                LocalTime.of(21, 0)
        );
    }

    private void seedSiteIfMissing(
            UUID id,
            String name,
            String location,
            LocalTime openingTime,
            LocalTime closingTime
    ) {
        if (siteRepository.existsById(id)) {
            return;
        }

        siteRepository.save(
                Site.builder()
                        .id(id)
                        .name(name)
                        .location(location)
                        .openingTime(openingTime)
                        .closingTime(closingTime)
                        .build()
        );
    }

    private void seedCourts() {
        seedCourtIfMissing(BRUSSELS_COURT_1_ID, "Court 1", SITE_BRUSSELS_ID, true);
        seedCourtIfMissing(BRUSSELS_COURT_2_ID, "Court 2", SITE_BRUSSELS_ID, true);
        seedCourtIfMissing(NAMUR_COURT_1_ID, "Court 1", SITE_NAMUR_ID, true);
        seedCourtIfMissing(NAMUR_COURT_2_ID, "Court 2", SITE_NAMUR_ID, true);
    }

    private void seedCourtIfMissing(
            UUID id,
            String name,
            UUID siteId,
            boolean active
    ) {
        if (courtRepository.existsById(id)) {
            return;
        }

        courtRepository.save(
                Court.builder()
                        .id(id)
                        .name(name)
                        .siteId(siteId)
                        .active(active)
                        .build()
        );
    }

    private void seedBookingRules() {
        if (bookingRuleRepository.existsById(BOOKING_RULE_ID)) {
            return;
        }

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
                LocalDate.now().plusDays(20),
                "Global maintenance"
        );

        seedClosedDayIfMissing(
                GLOBAL_CLOSED_DAY_2_ID,
                null,
                LocalDate.now().plusDays(45),
                "Global tournament"
        );

        seedClosedDayIfMissing(
                BRUSSELS_CLOSED_DAY_ID,
                SITE_BRUSSELS_ID,
                LocalDate.now().plusDays(12),
                "Brussels maintenance"
        );

        seedClosedDayIfMissing(
                NAMUR_CLOSED_DAY_ID,
                SITE_NAMUR_ID,
                LocalDate.now().plusDays(18),
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
        seedReservationIfMissing(
                PUBLIC_BRUSSELS_RESERVATION_ID,
                SITE_BRUSSELS_ID,
                BRUSSELS_COURT_1_ID,
                GLOBAL_MEMBER_ID,
                LocalDate.now().plusDays(5),
                LocalTime.of(10, 45),
                ReservationType.PUBLIC
        );

        seedReservationIfMissing(
                PRIVATE_BRUSSELS_RESERVATION_ID,
                SITE_BRUSSELS_ID,
                BRUSSELS_COURT_2_ID,
                GLOBAL_ADMIN_ID,
                LocalDate.now().plusDays(6),
                LocalTime.of(12, 30),
                ReservationType.PRIVATE
        );

        seedReservationIfMissing(
                PUBLIC_NAMUR_RESERVATION_ID,
                SITE_NAMUR_ID,
                NAMUR_COURT_1_ID,
                FREE_MEMBER_ID,
                LocalDate.now().plusDays(4),
                LocalTime.of(14, 15),
                ReservationType.PUBLIC
        );
    }

    private void seedReservationIfMissing(
            UUID id,
            UUID siteId,
            UUID courtId,
            UUID organizerId,
            LocalDate reservationDate,
            LocalTime startTime,
            ReservationType type
    ) {
        if (reservationRepository.existsById(id)) {
            return;
        }

        reservationRepository.save(
                Reservation.builder()
                        .id(id)
                        .siteId(siteId)
                        .courtId(courtId)
                        .organizerId(organizerId)
                        .reservationDate(reservationDate)
                        .startTime(startTime)
                        .type(type)
                        .status(ReservationStatus.ACTIVE)
                        .price(BigDecimal.valueOf(60))
                        .build()
        );
    }

    private void seedParticipations() {
        seedParticipationIfMissing(
                PUBLIC_BRUSSELS_RESERVATION_ID,
                GLOBAL_MEMBER_ID,
                "Other Global Member",
                ParticipationRole.ORGANIZER,
                true
        );

        seedParticipationIfMissing(
                PUBLIC_BRUSSELS_RESERVATION_ID,
                SITE_BRUSSELS_ADMIN_ID,
                "Site Admin Brussels",
                ParticipationRole.PLAYER,
                true
        );

        seedParticipationIfMissing(
                PUBLIC_BRUSSELS_RESERVATION_ID,
                FREE_MEMBER_ID,
                "Free Member",
                ParticipationRole.PLAYER,
                false
        );

        seedParticipationIfMissing(
                PRIVATE_BRUSSELS_RESERVATION_ID,
                GLOBAL_ADMIN_ID,
                "Global Admin",
                ParticipationRole.ORGANIZER,
                false
        );

        seedParticipationIfMissing(
                PRIVATE_BRUSSELS_RESERVATION_ID,
                SITE_BRUSSELS_ADMIN_ID,
                "Site Admin Brussels",
                ParticipationRole.PLAYER,
                false
        );

        seedParticipationIfMissing(
                PUBLIC_NAMUR_RESERVATION_ID,
                FREE_MEMBER_ID,
                "Free Member",
                ParticipationRole.ORGANIZER,
                true
        );

        seedParticipationIfMissing(
                PUBLIC_NAMUR_RESERVATION_ID,
                SITE_NAMUR_MEMBER_ID,
                "Site Member Namur",
                ParticipationRole.PLAYER,
                true
        );
    }

    private void seedParticipationIfMissing(
            UUID reservationId,
            UUID memberId,
            String memberName,
            ParticipationRole role,
            boolean paid
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
                        .role(role)
                        .paid(paid)
                        .status(paid ? ParticipationStatus.CONFIRMED : ParticipationStatus.PENDING)
                        .build()
        );
    }
}