package be.ephec.pdw.backend.reservation;

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
import be.ephec.pdw.backend.site.Site;
import be.ephec.pdw.backend.site.SiteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final ParticipationRepository participationRepository;
    private final ParticipationMapper participationMapper;
    private final MemberRepository memberRepository;
    private final SiteRepository siteRepository;
    private final CourtRepository courtRepository;
    private final BookingRuleRepository bookingRuleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ClosedDayRepository closedDayRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            ReservationMapper reservationMapper,
            ParticipationRepository participationRepository,
            ParticipationMapper participationMapper,
            MemberRepository memberRepository,
            SiteRepository siteRepository,
            CourtRepository courtRepository,
            BookingRuleRepository bookingRuleRepository,
            TimeSlotRepository timeSlotRepository,
            ClosedDayRepository closedDayRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.reservationMapper = reservationMapper;
        this.participationRepository = participationRepository;
        this.participationMapper = participationMapper;
        this.memberRepository = memberRepository;
        this.siteRepository = siteRepository;
        this.courtRepository = courtRepository;
        this.bookingRuleRepository = bookingRuleRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.closedDayRepository = closedDayRepository;
    }

    public List<ReservationDTO> getAllReservations(UUID currentUserId) {
        return reservationRepository.findAll()
                .stream()
                .map(reservation -> toDTOWithUserState(reservation, currentUserId))
                .toList();
    }

    public ReservationDTO getReservationById(UUID id, UUID currentUserId) {
        return reservationRepository.findById(id)
                .map(reservation -> toDTOWithUserState(reservation, currentUserId))
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));
    }

    public List<ReservationDTO> getPublicReservations(UUID currentUserId) {
        return reservationRepository.findByType(ReservationType.PUBLIC)
                .stream()
                .map(reservation -> toDTOWithUserState(reservation, currentUserId))
                .toList();
    }

    public List<ReservationDTO> getReservationsByOrganizerId(UUID organizerId, UUID currentUserId) {
        return reservationRepository.findByOrganizerId(organizerId)
                .stream()
                .map(reservation -> toDTOWithUserState(reservation, currentUserId))
                .toList();
    }

    public List<ReservationDTO> getReservationsByMemberId(UUID memberId) {
        Map<UUID, Reservation> reservations = new LinkedHashMap<>();

        reservationRepository.findByOrganizerId(memberId)
                .forEach(reservation -> reservations.put(reservation.getId(), reservation));

        participationRepository.findByMemberId(memberId)
                .forEach(participation -> reservationRepository.findById(participation.getReservationId())
                        .ifPresent(reservation -> reservations.put(reservation.getId(), reservation))
                );

        return reservations.values()
                .stream()
                .map(reservation -> toDTOWithUserState(reservation, memberId))
                .toList();
    }

    @Transactional
    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        BookingRule bookingRule = getBookingRule();

        validateBasicReservationInput(reservationDTO);

        Member organizer = memberRepository.findById(reservationDTO.organizerId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found."));

        if (organizer.getBlockedUntil() != null && organizer.getBlockedUntil().isAfter(LocalDate.now())) {
            throw new BusinessException(
                    "Member is blocked from creating reservations until " + organizer.getBlockedUntil() + "."
            );
        }

        if (organizer.getUnpaidBalance() != null
                && organizer.getUnpaidBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException(
                    "Member cannot create a reservation because he has an unpaid balance."
            );
        }

        validateSiteAndCourt(reservationDTO);
        validateReservationCreationRules(reservationDTO, organizer, bookingRule);
        validateStartTime(reservationDTO);
        validateCourtAvailability(reservationDTO);

        Reservation reservation = reservationMapper.toEntity(reservationDTO);

        reservation.setId(UUID.randomUUID());
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setPrice(bookingRule.getMatchPrice());

        Reservation savedReservation = reservationRepository.save(reservation);

        createOrganizerParticipationIfMissing(savedReservation, organizer);

        return toDTOWithUserState(savedReservation, organizer.getId());
    }

    public ParticipationDTO joinReservation(UUID reservationId, UUID memberId) {
        BookingRule bookingRule = getBookingRule();

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BusinessException("Only active reservations can be joined.");
        }

        if (reservation.getType() != ReservationType.PUBLIC) {
            throw new BusinessException("Only public reservations can be joined.");
        }

        if (reservation.getReservationDate().isBefore(LocalDate.now())) {
            throw new BusinessException("You cannot join a reservation in the past.");
        }

        if (participationRepository.countByReservationId(reservationId) >= bookingRule.getMaxPlayers()) {
            throw new BusinessException("Reservation is full.");
        }

        if (participationRepository.existsByReservationIdAndMemberId(reservationId, memberId)) {
            throw new BusinessException("Member already joined this reservation.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found."));

        if (member.getBlockedUntil() != null && member.getBlockedUntil().isAfter(LocalDate.now())) {
            throw new BusinessException(
                    "Member is blocked from joining reservations until " + member.getBlockedUntil() + "."
            );
        }

        Participation participation = Participation.builder()
                .id(UUID.randomUUID())
                .reservationId(reservationId)
                .memberId(member.getId())
                .memberName(member.getName())
                .role(ParticipationRole.PLAYER)
                .paid(false)
                .status(ParticipationStatus.PENDING)
                .build();

        Participation savedParticipation = participationRepository.save(participation);

        return participationMapper.toDTO(savedParticipation);
    }

    public List<ParticipationDTO> addPrivatePlayers(
            UUID reservationId,
            UUID organizerId,
            List<String> playerMatricules
    ) {
        BookingRule bookingRule = getBookingRule();

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BusinessException("Only active reservations can be modified.");
        }

        if (reservation.getType() != ReservationType.PRIVATE) {
            throw new BusinessException(
                    "Players can only be added manually to private reservations. Current type is: " + reservation.getType()
            );
        }

        if (!reservation.getOrganizerId().equals(organizerId)) {
            throw new BusinessException("Only the organizer can add players to this private reservation.");
        }

        if (playerMatricules == null || playerMatricules.isEmpty()) {
            throw new BusinessException("At least one player matricule is required.");
        }

        Set<String> uniqueMatricules = new HashSet<>(playerMatricules);

        if (uniqueMatricules.size() != playerMatricules.size()) {
            throw new BusinessException("The same player cannot be added twice.");
        }

        Member organizer = memberRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found."));

        if (uniqueMatricules.contains(organizer.getMatricule())) {
            throw new BusinessException("Organizer cannot be added as invited player.");
        }

        createOrganizerParticipationIfMissing(reservation, organizer);

        long currentParticipantsCount = participationRepository.countByReservationId(reservationId);

        if (currentParticipantsCount >= bookingRule.getMaxPlayers()) {
            throw new BusinessException("Private reservation already has the maximum number of players.");
        }

        if (currentParticipantsCount + playerMatricules.size() > bookingRule.getMaxPlayers()) {
            throw new BusinessException(
                    "Too many players for this private reservation. Maximum players: " + bookingRule.getMaxPlayers()
            );
        }

        for (String matricule : playerMatricules) {
            Member player = memberRepository.findByMatricule(matricule)
                    .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + matricule));

            if (player.getBlockedUntil() != null && player.getBlockedUntil().isAfter(LocalDate.now())) {
                throw new BusinessException("Member is blocked and cannot be added: " + matricule);
            }

            if (participationRepository.existsByReservationIdAndMemberId(reservationId, player.getId())) {
                throw new BusinessException("Member already added to this reservation: " + matricule);
            }

            Participation participation = Participation.builder()
                    .id(UUID.randomUUID())
                    .reservationId(reservationId)
                    .memberId(player.getId())
                    .memberName(player.getName())
                    .role(ParticipationRole.PLAYER)
                    .paid(false)
                    .status(ParticipationStatus.PENDING)
                    .build();

            participationRepository.save(participation);
        }

        return participationRepository.findByReservationId(reservationId)
                .stream()
                .map(participationMapper::toDTO)
                .toList();
    }

    public ReservationDTO applyPenaltyForIncompletePrivateReservation(UUID reservationId) {
        BookingRule bookingRule = getBookingRule();

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));

        if (reservation.getType() != ReservationType.PRIVATE) {
            throw new BusinessException("Only private reservations can receive this penalty.");
        }

        long participantsCount = participationRepository.countByReservationId(reservationId);

        if (participantsCount >= bookingRule.getMaxPlayers()) {
            throw new BusinessException("Private reservation is complete.");
        }

        Member organizer = memberRepository.findById(reservation.getOrganizerId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found."));

        reservation.setType(ReservationType.PUBLIC);
        organizer.setBlockedUntil(LocalDate.now().plusDays(bookingRule.getPrivatePenaltyBlockDays()));

        memberRepository.save(organizer);

        Reservation savedReservation = reservationRepository.save(reservation);

        return toDTOWithUserState(savedReservation, organizer.getId());
    }

    public ParticipationDTO payReservation(UUID reservationId, UUID memberId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BusinessException("Only active reservations can be paid.");
        }

        Participation participation = participationRepository
                .findByReservationIdAndMemberId(reservationId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation not found."));

        participation.setPaid(true);
        participation.setStatus(ParticipationStatus.CONFIRMED);

        Participation savedParticipation = participationRepository.save(participation);

        return participationMapper.toDTO(savedParticipation);
    }

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void automaticallyApplyPenaltiesForTomorrowPrivateReservations() {
        BookingRule bookingRule = getBookingRule();

        LocalDate targetDate = LocalDate.now().plusDays(bookingRule.getPenaltyCheckDaysBeforeMatch());

        List<Reservation> privateReservations =
                reservationRepository.findByTypeAndReservationDate(ReservationType.PRIVATE, targetDate);

        for (Reservation reservation : privateReservations) {
            long participantsCount = participationRepository.countByReservationId(reservation.getId());

            if (participantsCount < bookingRule.getMaxPlayers()) {
                applyPenaltyForIncompletePrivateReservation(reservation.getId());
            }
        }
    }

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void automaticallyApplyUnpaidBalanceForTomorrowPublicReservations() {
        BookingRule bookingRule = getBookingRule();

        LocalDate targetDate = LocalDate.now().plusDays(bookingRule.getPenaltyCheckDaysBeforeMatch());

        List<Reservation> publicReservations =
                reservationRepository.findByTypeAndReservationDate(ReservationType.PUBLIC, targetDate);

        for (Reservation reservation : publicReservations) {
            if (reservation.isBalanceApplied()) {
                continue;
            }

            long paidParticipantsCount = participationRepository.findByReservationId(reservation.getId())
                    .stream()
                    .filter(Participation::isPaid)
                    .count();

            if (paidParticipantsCount >= bookingRule.getMaxPlayers()) {
                reservation.setBalanceApplied(true);
                reservationRepository.save(reservation);
                continue;
            }

            int missingPlayers = bookingRule.getMaxPlayers() - (int) paidParticipantsCount;
            BigDecimal amountDue = BigDecimal.valueOf(missingPlayers)
                    .multiply(bookingRule.getPenaltyAmountPerMissingPlayer());

            Member organizer = memberRepository.findById(reservation.getOrganizerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Organizer not found."));

            BigDecimal currentBalance = organizer.getUnpaidBalance() == null
                    ? BigDecimal.ZERO
                    : organizer.getUnpaidBalance();

            organizer.setUnpaidBalance(currentBalance.add(amountDue));
            memberRepository.save(organizer);

            reservation.setBalanceApplied(true);
            reservationRepository.save(reservation);
        }
    }

    private ReservationDTO toDTOWithUserState(Reservation reservation, UUID currentUserId) {
        long participantsCount = participationRepository.countByReservationId(reservation.getId());

        boolean currentUserJoined = false;
        boolean currentUserPaid = false;

        if (currentUserId != null) {
            currentUserJoined = participationRepository
                    .existsByReservationIdAndMemberId(reservation.getId(), currentUserId);

            currentUserPaid = participationRepository
                    .findByReservationIdAndMemberId(reservation.getId(), currentUserId)
                    .map(Participation::isPaid)
                    .orElse(false);
        }

        return reservationMapper.toDTO(
                reservation,
                participantsCount,
                currentUserJoined,
                currentUserPaid
        );
    }

    private BookingRule getBookingRule() {
        return bookingRuleRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Booking rules not found."));
    }

    private void validateBasicReservationInput(ReservationDTO reservationDTO) {
        if (reservationDTO == null) {
            throw new BusinessException("Reservation is required.");
        }

        if (reservationDTO.organizerId() == null) {
            throw new BusinessException("Organizer is required.");
        }

        if (reservationDTO.reservationDate() == null) {
            throw new BusinessException("Reservation date is required.");
        }

        if (reservationDTO.type() == null) {
            throw new BusinessException("Reservation type is required.");
        }
    }

    private void validateReservationCreationRules(
            ReservationDTO reservationDTO,
            Member organizer,
            BookingRule bookingRule
    ) {
        long daysBeforeMatch = getDaysBeforeMatch(reservationDTO.reservationDate());

        if (daysBeforeMatch < 0) {
            throw new BusinessException("You cannot create a reservation in the past.");
        }

        validateClosedDays(reservationDTO);

        switch (organizer.getType()) {
            case GLOBAL -> validateGlobalMemberBooking(daysBeforeMatch, bookingRule);
            case SITE -> validateSiteMemberBooking(reservationDTO, organizer, daysBeforeMatch, bookingRule);
            case FREE -> validateFreeMemberBooking(daysBeforeMatch, bookingRule);
        }
    }

    private void validateSiteAndCourt(ReservationDTO reservationDTO) {
        if (reservationDTO.siteId() == null) {
            throw new BusinessException("Site is required.");
        }

        if (reservationDTO.courtId() == null) {
            throw new BusinessException("Court is required.");
        }

        Site site = siteRepository.findById(reservationDTO.siteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));

        Court court = courtRepository.findById(reservationDTO.courtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found."));

        if (!court.isActive()) {
            throw new BusinessException("This court is not active.");
        }

        if (!court.getSiteId().equals(site.getId())) {
            throw new BusinessException("This court does not belong to the selected site.");
        }
    }

    private void validateStartTime(ReservationDTO reservationDTO) {
        if (reservationDTO.startTime() == null) {
            throw new BusinessException("Start time is required.");
        }

        Site site = siteRepository.findById(reservationDTO.siteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));

        TimeSlot timeSlot = timeSlotRepository.findByStartTimeAndActiveTrue(reservationDTO.startTime())
                .orElseThrow(() -> new BusinessException("This time slot is not allowed."));

        if (timeSlot.getStartTime().isBefore(site.getOpeningTime())) {
            throw new BusinessException("Reservation cannot start before site opening time.");
        }

        if (timeSlot.getEndTime().isAfter(site.getClosingTime())) {
            throw new BusinessException("Reservation cannot end after site closing time.");
        }
    }

    private void validateCourtAvailability(ReservationDTO reservationDTO) {
        boolean alreadyBooked = reservationRepository.existsByCourtIdAndReservationDateAndStartTimeAndStatus(
                reservationDTO.courtId(),
                reservationDTO.reservationDate(),
                reservationDTO.startTime(),
                ReservationStatus.ACTIVE
        );

        if (alreadyBooked) {
            throw new BusinessException("This court is already booked at this date and time.");
        }
    }

    private void createOrganizerParticipationIfMissing(
            Reservation reservation,
            Member organizer
    ) {
        boolean organizerAlreadyParticipant = participationRepository.existsByReservationIdAndMemberId(
                reservation.getId(),
                organizer.getId()
        );

        if (organizerAlreadyParticipant) {
            return;
        }

        Participation organizerParticipation = Participation.builder()
                .id(UUID.randomUUID())
                .reservationId(reservation.getId())
                .memberId(organizer.getId())
                .memberName(organizer.getName())
                .role(ParticipationRole.ORGANIZER)
                .paid(false)
                .status(ParticipationStatus.PENDING)
                .build();

        participationRepository.save(organizerParticipation);
    }

    private void validateClosedDays(ReservationDTO reservationDTO) {
        boolean globalClosedDay = closedDayRepository.existsByActiveTrueAndSiteIdIsNullAndClosedDate(
                reservationDTO.reservationDate()
        );

        if (globalClosedDay) {
            throw new BusinessException("Reservations are not allowed on a global closed day.");
        }

        boolean siteClosedDay = closedDayRepository.existsByActiveTrueAndSiteIdAndClosedDate(
                reservationDTO.siteId(),
                reservationDTO.reservationDate()
        );

        if (siteClosedDay) {
            throw new BusinessException("Reservations are not allowed on a closed day for this site.");
        }
    }

    private long getDaysBeforeMatch(LocalDate reservationDate) {
        return ChronoUnit.DAYS.between(LocalDate.now(), reservationDate);
    }

    private void validateGlobalMemberBooking(long daysBeforeMatch, BookingRule bookingRule) {
        if (daysBeforeMatch > bookingRule.getGlobalBookingLimitDays()) {
            throw new BusinessException(
                    "Global members can only book up to "
                            + bookingRule.getGlobalBookingLimitDays()
                            + " days before the match."
            );
        }
    }

    private void validateSiteMemberBooking(
            ReservationDTO reservationDTO,
            Member organizer,
            long daysBeforeMatch,
            BookingRule bookingRule
    ) {
        if (daysBeforeMatch > bookingRule.getSiteBookingLimitDays()) {
            throw new BusinessException(
                    "Site members can only book up to "
                            + bookingRule.getSiteBookingLimitDays()
                            + " days before the match."
            );
        }

        if (organizer.getSiteId() == null || !organizer.getSiteId().equals(reservationDTO.siteId().toString())) {
            throw new BusinessException("Site members can only book on their own site.");
        }
    }

    private void validateFreeMemberBooking(long daysBeforeMatch, BookingRule bookingRule) {
        if (daysBeforeMatch > bookingRule.getFreeBookingLimitDays()) {
            throw new BusinessException(
                    "Free members can only book up to "
                            + bookingRule.getFreeBookingLimitDays()
                            + " days before the match."
            );
        }
    }
}