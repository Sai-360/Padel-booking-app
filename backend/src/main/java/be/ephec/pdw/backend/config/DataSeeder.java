package be.ephec.pdw.backend.config;

import be.ephec.pdw.backend.court.Court;
import be.ephec.pdw.backend.court.CourtRepository;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.member.MemberType;
import be.ephec.pdw.backend.reservation.Reservation;
import be.ephec.pdw.backend.reservation.ReservationRepository;
import be.ephec.pdw.backend.reservation.ReservationStatus;
import be.ephec.pdw.backend.reservation.ReservationType;
import be.ephec.pdw.backend.site.Site;
import be.ephec.pdw.backend.site.SiteRepository;
import org.springframework.boot.CommandLineRunner;
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

    private static final UUID SITE_BRUSSELS_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID SITE_NAMUR_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static final UUID COURT_1_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID COURT_2_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private final MemberRepository memberRepository;
    private final SiteRepository siteRepository;
    private final CourtRepository courtRepository;
    private final ReservationRepository reservationRepository;

    public DataSeeder(
            MemberRepository memberRepository,
            SiteRepository siteRepository,
            CourtRepository courtRepository,
            ReservationRepository reservationRepository
    ) {
        this.memberRepository = memberRepository;
        this.siteRepository = siteRepository;
        this.courtRepository = courtRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public void run(String... args) {
        seedMembers();
        seedSites();
        seedCourts();
        seedReservations();
    }

    private void seedMembers() {
        if (memberRepository.count() > 0) {
            return;
        }

        memberRepository.save(
                Member.builder()
                        .id(GLOBAL_USER_ID)
                        .matricule("G0001")
                        .name("Global Member")
                        .type(MemberType.GLOBAL)
                        .siteId(null)
                        .unpaidBalance(BigDecimal.ZERO)
                        .blockedUntil(null)
                        .build()
        );

        memberRepository.save(
                Member.builder()
                        .id(OTHER_USER_ID)
                        .matricule("G0002")
                        .name("Other Global Member")
                        .type(MemberType.GLOBAL)
                        .siteId(null)
                        .unpaidBalance(BigDecimal.ZERO)
                        .blockedUntil(null)
                        .build()
        );

        memberRepository.save(
                Member.builder()
                        .id(SITE_USER_ID)
                        .matricule("S0001")
                        .name("Site Member Brussels")
                        .type(MemberType.SITE)
                        .siteId(SITE_BRUSSELS_ID.toString())
                        .unpaidBalance(BigDecimal.ZERO)
                        .blockedUntil(null)
                        .build()
        );

        memberRepository.save(
                Member.builder()
                        .id(FREE_USER_ID)
                        .matricule("L0001")
                        .name("Free Member")
                        .type(MemberType.FREE)
                        .siteId(null)
                        .unpaidBalance(BigDecimal.ZERO)
                        .blockedUntil(null)
                        .build()
        );
    }

    private void seedSites() {
        if (siteRepository.count() > 0) {
            return;
        }

        siteRepository.save(
                Site.builder()
                        .id(SITE_BRUSSELS_ID)
                        .name("Padel Brussels")
                        .location("Brussels")
                        .openingTime(LocalTime.of(8, 0))
                        .closingTime(LocalTime.of(22, 0))
                        .build()
        );

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

    private void seedCourts() {
        if (courtRepository.count() > 0) {
            return;
        }

        courtRepository.save(
                Court.builder()
                        .id(COURT_1_ID)
                        .name("Court 1")
                        .siteId(SITE_BRUSSELS_ID)
                        .active(true)
                        .build()
        );

        courtRepository.save(
                Court.builder()
                        .id(COURT_2_ID)
                        .name("Court 2")
                        .siteId(SITE_BRUSSELS_ID)
                        .active(true)
                        .build()
        );
    }

    private void seedReservations() {
        if (reservationRepository.count() > 0) {
            return;
        }

        reservationRepository.save(
                Reservation.builder()
                        .id(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"))
                        .siteId(SITE_BRUSSELS_ID)
                        .courtId(COURT_1_ID)
                        .organizerId(OTHER_USER_ID)
                        .reservationDate(LocalDate.now().plusDays(5))
                        .startTime(LocalTime.of(10, 30))
                        .type(ReservationType.PUBLIC)
                        .status(ReservationStatus.ACTIVE)
                        .price(BigDecimal.valueOf(60))
                        .build()
        );

        reservationRepository.save(
                Reservation.builder()
                        .id(UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"))
                        .siteId(SITE_BRUSSELS_ID)
                        .courtId(COURT_2_ID)
                        .organizerId(GLOBAL_USER_ID)
                        .reservationDate(LocalDate.now().plusDays(6))
                        .startTime(LocalTime.of(12, 0))
                        .type(ReservationType.PRIVATE)
                        .status(ReservationStatus.ACTIVE)
                        .price(BigDecimal.valueOf(60))
                        .build()
        );
    }
}