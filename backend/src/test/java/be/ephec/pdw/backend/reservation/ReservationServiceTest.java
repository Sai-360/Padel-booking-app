package be.ephec.pdw.backend.reservation;

import be.ephec.pdw.backend.AbstractUnitTest;
import be.ephec.pdw.backend.booking.BookingRule;
import be.ephec.pdw.backend.booking.BookingRuleRepository;
import be.ephec.pdw.backend.booking.ClosedDayRepository;
import be.ephec.pdw.backend.booking.TimeSlot;
import be.ephec.pdw.backend.booking.TimeSlotRepository;
import be.ephec.pdw.backend.court.Court;
import be.ephec.pdw.backend.court.CourtRepository;
import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.member.MemberType;
import be.ephec.pdw.backend.site.Site;
import be.ephec.pdw.backend.site.SiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@MockitoSettings(strictness = Strictness.LENIENT)
class ReservationServiceTest extends AbstractUnitTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private CourtRepository courtRepository;

    @Mock
    private BookingRuleRepository bookingRuleRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private ClosedDayRepository closedDayRepository;

    private ReservationService reservationService;

    private final ReservationMapper reservationMapper = new ReservationMapper();
    private final ParticipationMapper participationMapper = new ParticipationMapper();

    private final UUID globalMemberId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID siteMemberId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID freeMemberId = UUID.fromString("33333333-3333-3333-3333-333333333333");

    private final UUID brusselsSiteId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID namurSiteId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID courtId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID reservationId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private final LocalDate validReservationDate = LocalDate.now().plusDays(5);
    private final LocalTime validStartTime = LocalTime.of(10, 30);

    @BeforeEach
    void setUp() {
        reservationService = new ReservationService(
                reservationRepository,
                reservationMapper,
                participationRepository,
                participationMapper,
                memberRepository,
                siteRepository,
                courtRepository,
                bookingRuleRepository,
                timeSlotRepository,
                closedDayRepository
        );
    }

    @Test
    void createReservationAutomaticallyAddsOrganizerAsParticipant() {
        Member organizer = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(organizer, brusselsSiteId, false);

        ReservationDTO result = reservationService.createReservation(reservationDTO);

        assertNotNull(result);
        assertEquals(globalMemberId, result.organizerId());
        assertEquals(ReservationType.PUBLIC, result.type());
        assertEquals(ReservationStatus.ACTIVE, result.status());
        assertEquals(BigDecimal.valueOf(60), result.price());

        verify(reservationRepository).save(any(Reservation.class));

        verify(participationRepository).save(argThat(participation ->
                participation.getReservationId() != null
                        && participation.getMemberId().equals(globalMemberId)
                        && participation.getMemberName().equals("G0001 Member")
                        && participation.getRole() == ParticipationRole.ORGANIZER
                        && !participation.isPaid()
                        && participation.getStatus() == ParticipationStatus.PENDING
        ));
    }

    @Test
    void createReservationThrowsBusinessExceptionWhenCourtIsAlreadyBookedAtSameDateAndTime() {
        Member organizer = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(organizer, brusselsSiteId, true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("This court is already booked at this date and time.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void siteMemberCanCreateReservationOnOwnSiteWithinLimit() {
        Member siteMember = createMember(
                siteMemberId,
                "S0001",
                MemberType.SITE,
                brusselsSiteId.toString()
        );

        ReservationDTO reservationDTO = createReservationDTO(
                siteMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(siteMember, brusselsSiteId, false);

        ReservationDTO result = reservationService.createReservation(reservationDTO);

        assertNotNull(result);
        assertEquals(siteMemberId, result.organizerId());
        assertEquals(brusselsSiteId, result.siteId());

        verify(reservationRepository).save(any(Reservation.class));
        verify(participationRepository).save(any(Participation.class));
    }

    @Test
    void siteMemberCannotCreateReservationOnAnotherSite() {
        Member siteMember = createMember(
                siteMemberId,
                "S0001",
                MemberType.SITE,
                brusselsSiteId.toString()
        );

        ReservationDTO reservationDTO = createReservationDTO(
                siteMemberId,
                namurSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(siteMember, namurSiteId, false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Site members can only book on their own site.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void globalMemberCannotCreateReservationAfterGlobalBookingLimit() {
        Member globalMember = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(22),
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(globalMember, brusselsSiteId, false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Global members can only book up to 21 days before the match.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void freeMemberCannotCreateReservationAfterFreeBookingLimit() {
        Member freeMember = createMember(freeMemberId, "L0001", MemberType.FREE, null);

        ReservationDTO reservationDTO = createReservationDTO(
                freeMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(6),
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(freeMember, brusselsSiteId, false);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Free members can only book up to 5 days before the match.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void createReservationThrowsBusinessExceptionOnGlobalClosedDay() {
        Member organizer = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(organizer, brusselsSiteId, false);

        when(closedDayRepository.existsByActiveTrueAndSiteIdIsNullAndClosedDate(validReservationDate))
                .thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Reservations are not allowed on a global closed day.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void createReservationThrowsBusinessExceptionWhenTimeSlotIsNotAllowed() {
        Member organizer = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockValidReservationCreationContext(organizer, brusselsSiteId, false);

        when(timeSlotRepository.findByStartTimeAndActiveTrue(validStartTime))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("This time slot is not allowed.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void memberCanJoinPublicReservationWhenThereIsAvailableSpace() {
        Member member = createMember(siteMemberId, "S0001", MemberType.SITE, brusselsSiteId.toString());

        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockBookingRule();

        when(reservationRepository.findById(reservationId))
                .thenReturn(Optional.of(publicReservation));

        when(participationRepository.countByReservationId(reservationId))
                .thenReturn(1L);

        when(participationRepository.existsByReservationIdAndMemberId(reservationId, siteMemberId))
                .thenReturn(false);

        when(memberRepository.findById(siteMemberId))
                .thenReturn(Optional.of(member));

        when(participationRepository.save(any(Participation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ParticipationDTO result = reservationService.joinReservation(reservationId, siteMemberId);

        assertNotNull(result);
        assertEquals(reservationId, result.reservationId());
        assertEquals(siteMemberId, result.memberId());
        assertEquals(ParticipationRole.PLAYER, result.role());
        assertFalse(result.paid());
        assertEquals(ParticipationStatus.PENDING, result.status());

        verify(participationRepository).save(any(Participation.class));
    }

    @Test
    void memberCannotJoinFullReservation() {
        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockBookingRule();

        when(reservationRepository.findById(reservationId))
                .thenReturn(Optional.of(publicReservation));

        when(participationRepository.countByReservationId(reservationId))
                .thenReturn(4L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.joinReservation(reservationId, siteMemberId)
        );

        assertEquals("Reservation is full.", exception.getMessage());

        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void payReservationSetsParticipationAsPaidAndConfirmed() {
        Reservation reservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        Participation participation = Participation.builder()
                .id(UUID.randomUUID())
                .reservationId(reservationId)
                .memberId(siteMemberId)
                .memberName("S0001 Member")
                .role(ParticipationRole.PLAYER)
                .paid(false)
                .status(ParticipationStatus.PENDING)
                .build();

        when(reservationRepository.findById(reservationId))
                .thenReturn(Optional.of(reservation));

        when(participationRepository.findByReservationIdAndMemberId(reservationId, siteMemberId))
                .thenReturn(Optional.of(participation));

        when(participationRepository.save(any(Participation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ParticipationDTO result = reservationService.payReservation(reservationId, siteMemberId);

        assertTrue(result.paid());
        assertEquals(ParticipationStatus.CONFIRMED, result.status());

        verify(participationRepository).save(any(Participation.class));
    }

    @Test
    void automaticallyApplyUnpaidBalanceForTomorrowPublicReservationsReleasesUnpaidPlayerPlacesAndChargesOrganizer() {
        mockBookingRule();

        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(1),
                ReservationType.PUBLIC
        );

        Member organizer = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        Participation organizerParticipation = Participation.builder()
                .id(UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"))
                .reservationId(reservationId)
                .memberId(globalMemberId)
                .memberName("G0001 Member")
                .role(ParticipationRole.ORGANIZER)
                .paid(true)
                .status(ParticipationStatus.CONFIRMED)
                .build();

        Participation paidPlayer = Participation.builder()
                .id(UUID.fromString("aaaaaaaa-2222-2222-2222-222222222222"))
                .reservationId(reservationId)
                .memberId(siteMemberId)
                .memberName("S0001 Member")
                .role(ParticipationRole.PLAYER)
                .paid(true)
                .status(ParticipationStatus.CONFIRMED)
                .build();

        Participation unpaidPlayer = Participation.builder()
                .id(UUID.fromString("aaaaaaaa-3333-3333-3333-333333333333"))
                .reservationId(reservationId)
                .memberId(freeMemberId)
                .memberName("L0001 Member")
                .role(ParticipationRole.PLAYER)
                .paid(false)
                .status(ParticipationStatus.PENDING)
                .build();

        when(reservationRepository.findByTypeAndReservationDate(
                ReservationType.PUBLIC,
                LocalDate.now().plusDays(1)
        )).thenReturn(List.of(publicReservation));

        when(participationRepository.findByReservationId(reservationId))
                .thenReturn(List.of(organizerParticipation, paidPlayer, unpaidPlayer));

        when(memberRepository.findById(globalMemberId))
                .thenReturn(Optional.of(organizer));

        when(memberRepository.save(any(Member.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.automaticallyApplyUnpaidBalanceForTomorrowPublicReservations();

        verify(participationRepository).delete(unpaidPlayer);
        verify(participationRepository, never()).delete(organizerParticipation);
        verify(participationRepository, never()).delete(paidPlayer);

        assertEquals(BigDecimal.valueOf(30), organizer.getUnpaidBalance());
        assertTrue(publicReservation.isBalanceApplied());

        verify(memberRepository).save(organizer);
        verify(reservationRepository).save(publicReservation);
    }

    @Test
    void createReservationThrowsNotFoundWhenOrganizerDoesNotExist() {
        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                validReservationDate,
                ReservationType.PUBLIC
        );

        mockBookingRule();

        when(memberRepository.findById(globalMemberId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Organizer not found.", exception.getMessage());

        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(participationRepository, never()).save(any(Participation.class));
    }

    private void mockValidReservationCreationContext(
            Member organizer,
            UUID siteId,
            boolean alreadyBooked
    ) {
        mockBookingRule();

        when(memberRepository.findById(organizer.getId()))
                .thenReturn(Optional.of(organizer));

        Site site = mock(Site.class);
        when(site.getId()).thenReturn(siteId);
        when(site.getOpeningTime()).thenReturn(LocalTime.of(9, 0));
        when(site.getClosingTime()).thenReturn(LocalTime.of(22, 0));

        when(siteRepository.findById(siteId))
                .thenReturn(Optional.of(site));

        Court court = mock(Court.class);
        when(court.isActive()).thenReturn(true);
        when(court.getSiteId()).thenReturn(siteId);

        when(courtRepository.findById(courtId))
                .thenReturn(Optional.of(court));

        TimeSlot timeSlot = mock(TimeSlot.class);
        when(timeSlot.getStartTime()).thenReturn(validStartTime);
        when(timeSlot.getEndTime()).thenReturn(LocalTime.of(12, 0));

        when(timeSlotRepository.findByStartTimeAndActiveTrue(validStartTime))
                .thenReturn(Optional.of(timeSlot));

        when(closedDayRepository.existsByActiveTrueAndSiteIdIsNullAndClosedDate(any(LocalDate.class)))
                .thenReturn(false);

        when(closedDayRepository.existsByActiveTrueAndSiteIdAndClosedDate(any(UUID.class), any(LocalDate.class)))
                .thenReturn(false);

        when(reservationRepository.existsByCourtIdAndReservationDateAndStartTimeAndStatus(
                eq(courtId),
                any(LocalDate.class),
                eq(validStartTime),
                eq(ReservationStatus.ACTIVE)
        )).thenReturn(alreadyBooked);

        when(participationRepository.existsByReservationIdAndMemberId(any(UUID.class), any(UUID.class)))
                .thenReturn(false);

        when(participationRepository.findByReservationIdAndMemberId(any(UUID.class), any(UUID.class)))
                .thenReturn(Optional.empty());

        when(participationRepository.countByReservationId(any(UUID.class)))
                .thenReturn(0L);

        if (!alreadyBooked) {
            when(reservationRepository.save(any(Reservation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            when(participationRepository.save(any(Participation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
        }
    }

    private void mockBookingRule() {
        BookingRule bookingRule = mock(BookingRule.class);

        lenient().when(bookingRule.getMatchPrice()).thenReturn(BigDecimal.valueOf(60));
        lenient().when(bookingRule.getMaxPlayers()).thenReturn(4);
        lenient().when(bookingRule.getGlobalBookingLimitDays()).thenReturn(21);
        lenient().when(bookingRule.getSiteBookingLimitDays()).thenReturn(14);
        lenient().when(bookingRule.getFreeBookingLimitDays()).thenReturn(5);
        lenient().when(bookingRule.getPenaltyAmountPerMissingPlayer()).thenReturn(BigDecimal.valueOf(15));
        lenient().when(bookingRule.getPrivatePenaltyBlockDays()).thenReturn(7);
        lenient().when(bookingRule.getPenaltyCheckDaysBeforeMatch()).thenReturn(1);

        when(bookingRuleRepository.findFirstByOrderByIdAsc())
                .thenReturn(Optional.of(bookingRule));
    }

    private Member createMember(
            UUID id,
            String matricule,
            MemberType type,
            String siteId
    ) {
        return Member.builder()
                .id(id)
                .matricule(matricule)
                .name(matricule + " Member")
                .type(type)
                .siteId(siteId)
                .unpaidBalance(BigDecimal.ZERO)
                .blockedUntil(null)
                .build();
    }

    private ReservationDTO createReservationDTO(
            UUID organizerId,
            UUID siteId,
            LocalDate reservationDate,
            ReservationType type
    ) {
        return new ReservationDTO(
                reservationId,
                siteId,
                courtId,
                organizerId,
                reservationDate,
                validStartTime,
                type,
                ReservationStatus.ACTIVE,
                BigDecimal.valueOf(999),
                0,
                false,
                false
        );
    }

    private Reservation createReservation(
            UUID organizerId,
            UUID siteId,
            LocalDate reservationDate,
            ReservationType type
    ) {
        return Reservation.builder()
                .id(reservationId)
                .siteId(siteId)
                .courtId(courtId)
                .organizerId(organizerId)
                .reservationDate(reservationDate)
                .startTime(validStartTime)
                .type(type)
                .status(ReservationStatus.ACTIVE)
                .price(BigDecimal.valueOf(60))
                .build();
    }
}