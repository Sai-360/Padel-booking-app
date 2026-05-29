package be.ephec.pdw.backend.reservation;

import be.ephec.pdw.backend.AbstractUnitTest;
import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.member.MemberType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReservationServiceTest extends AbstractUnitTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private MemberRepository memberRepository;

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

    @BeforeEach
    void setUp() {
        reservationService = new ReservationService(
                reservationRepository,
                reservationMapper,
                participationRepository,
                participationMapper,
                memberRepository
        );
    }

    @Test
    void globalMemberCanCreateReservationWithin21Days() {
        Member globalMember = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(10),
                ReservationType.PUBLIC
        );

        Reservation savedReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(10),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(globalMemberId)).thenReturn(Optional.of(globalMember));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
        when(participationRepository.countByReservationId(reservationId)).thenReturn(0L);

        ReservationDTO result = reservationService.createReservation(reservationDTO);

        assertNotNull(result);
        assertEquals(globalMemberId, result.organizerId());
        assertEquals(ReservationType.PUBLIC, result.type());
        assertEquals(0, result.participantsCount());

        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void globalMemberCannotCreateReservationMoreThan21DaysBeforeMatch() {
        Member globalMember = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(22),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(globalMemberId)).thenReturn(Optional.of(globalMember));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Global members can only book up to 3 weeks before the match.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void siteMemberCanCreateReservationOnOwnSiteWithin14Days() {
        Member siteMember = createMember(
                siteMemberId,
                "S0001",
                MemberType.SITE,
                brusselsSiteId.toString()
        );

        ReservationDTO reservationDTO = createReservationDTO(
                siteMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(10),
                ReservationType.PUBLIC
        );

        Reservation savedReservation = createReservation(
                siteMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(10),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(siteMemberId)).thenReturn(Optional.of(siteMember));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
        when(participationRepository.countByReservationId(reservationId)).thenReturn(0L);

        ReservationDTO result = reservationService.createReservation(reservationDTO);

        assertNotNull(result);
        assertEquals(siteMemberId, result.organizerId());
        assertEquals(brusselsSiteId, result.siteId());

        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void siteMemberCannotCreateReservationMoreThan14DaysBeforeMatch() {
        Member siteMember = createMember(
                siteMemberId,
                "S0001",
                MemberType.SITE,
                brusselsSiteId.toString()
        );

        ReservationDTO reservationDTO = createReservationDTO(
                siteMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(15),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(siteMemberId)).thenReturn(Optional.of(siteMember));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Site members can only book up to 2 weeks before the match.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
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
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(siteMemberId)).thenReturn(Optional.of(siteMember));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Site members can only book on their own site.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void freeMemberCanCreateReservationWithin5Days() {
        Member freeMember = createMember(freeMemberId, "L0001", MemberType.FREE, null);

        ReservationDTO reservationDTO = createReservationDTO(
                freeMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        Reservation savedReservation = createReservation(
                freeMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(freeMemberId)).thenReturn(Optional.of(freeMember));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
        when(participationRepository.countByReservationId(reservationId)).thenReturn(0L);

        ReservationDTO result = reservationService.createReservation(reservationDTO);

        assertNotNull(result);
        assertEquals(freeMemberId, result.organizerId());

        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void freeMemberCannotCreateReservationMoreThan5DaysBeforeMatch() {
        Member freeMember = createMember(freeMemberId, "L0001", MemberType.FREE, null);

        ReservationDTO reservationDTO = createReservationDTO(
                freeMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(6),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(freeMemberId)).thenReturn(Optional.of(freeMember));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Free members can only book up to 5 days before the match.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void memberCannotCreateReservationInPast() {
        Member globalMember = createMember(globalMemberId, "G0001", MemberType.GLOBAL, null);

        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().minusDays(1),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(globalMemberId)).thenReturn(Optional.of(globalMember));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("You cannot create a reservation in the past.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void memberCanJoinPublicReservation() {
        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        Member siteMember = createMember(siteMemberId, "S0001", MemberType.SITE, brusselsSiteId.toString());

        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(publicReservation));
        when(participationRepository.countByReservationId(reservationId)).thenReturn(1L);
        when(participationRepository.existsByReservationIdAndMemberId(reservationId, siteMemberId))
                .thenReturn(false);
        when(memberRepository.findById(siteMemberId)).thenReturn(Optional.of(siteMember));
        when(participationRepository.save(any(Participation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ParticipationDTO result = reservationService.joinReservation(reservationId, siteMemberId);

        assertNotNull(result);
        assertEquals(reservationId, result.reservationId());
        assertEquals(siteMemberId, result.memberId());
        assertFalse(result.paid());
        assertEquals(ParticipationStatus.PENDING, result.status());

        verify(participationRepository).save(any(Participation.class));
    }

    @Test
    void memberCannotJoinPrivateReservation() {
        Reservation privateReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PRIVATE
        );

        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(privateReservation));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.joinReservation(reservationId, siteMemberId)
        );

        assertEquals("Only public reservations can be joined.", exception.getMessage());
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void memberCannotJoinFullReservation() {
        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(publicReservation));
        when(participationRepository.countByReservationId(reservationId)).thenReturn(4L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.joinReservation(reservationId, siteMemberId)
        );

        assertEquals("Reservation is full.", exception.getMessage());
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void memberCannotJoinSameReservationTwice() {
        Reservation publicReservation = createReservation(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(publicReservation));
        when(participationRepository.countByReservationId(reservationId)).thenReturn(1L);
        when(participationRepository.existsByReservationIdAndMemberId(reservationId, siteMemberId))
                .thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reservationService.joinReservation(reservationId, siteMemberId)
        );

        assertEquals("Member already joined this reservation.", exception.getMessage());
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void payReservationSetsParticipationAsPaidAndConfirmed() {
        Participation participation = Participation.builder()
                .id(UUID.randomUUID())
                .reservationId(reservationId)
                .memberId(siteMemberId)
                .memberName("Site Member")
                .role(ParticipationRole.PLAYER)
                .paid(false)
                .status(ParticipationStatus.PENDING)
                .build();

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
    void createReservationThrowsNotFoundWhenOrganizerDoesNotExist() {
        ReservationDTO reservationDTO = createReservationDTO(
                globalMemberId,
                brusselsSiteId,
                LocalDate.now().plusDays(5),
                ReservationType.PUBLIC
        );

        when(memberRepository.findById(globalMemberId)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reservationService.createReservation(reservationDTO)
        );

        assertEquals("Organizer not found.", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void joinReservationThrowsNotFoundWhenReservationDoesNotExist() {
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reservationService.joinReservation(reservationId, siteMemberId)
        );

        assertEquals("Reservation not found.", exception.getMessage());
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    void payReservationThrowsNotFoundWhenParticipationDoesNotExist() {
        when(participationRepository.findByReservationIdAndMemberId(reservationId, siteMemberId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reservationService.payReservation(reservationId, siteMemberId)
        );

        assertEquals("Participation not found.", exception.getMessage());
        verify(participationRepository, never()).save(any(Participation.class));
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
                LocalTime.of(10, 30),
                type,
                ReservationStatus.ACTIVE,
                BigDecimal.valueOf(60),
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
                .startTime(LocalTime.of(10, 30))
                .type(type)
                .status(ReservationStatus.ACTIVE)
                .price(BigDecimal.valueOf(60))
                .build();
    }
}