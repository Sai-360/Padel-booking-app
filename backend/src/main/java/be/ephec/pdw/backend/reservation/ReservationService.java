package be.ephec.pdw.backend.reservation;

import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.exception.ResourceNotFoundException;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final ParticipationRepository participationRepository;
    private final ParticipationMapper participationMapper;
    private final MemberRepository memberRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            ReservationMapper reservationMapper,
            ParticipationRepository participationRepository,
            ParticipationMapper participationMapper,
            MemberRepository memberRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.reservationMapper = reservationMapper;
        this.participationRepository = participationRepository;
        this.participationMapper = participationMapper;
        this.memberRepository = memberRepository;
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

    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        Member organizer = memberRepository.findById(reservationDTO.organizerId())
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found."));

        validateReservationCreationRules(reservationDTO, organizer);

        Reservation reservation = reservationMapper.toEntity(reservationDTO);
        Reservation savedReservation = reservationRepository.save(reservation);

        return toDTOWithUserState(savedReservation, organizer.getId());
    }

    public ParticipationDTO joinReservation(UUID reservationId, UUID memberId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found."));

        if (reservation.getType() != ReservationType.PUBLIC) {
            throw new BusinessException("Only public reservations can be joined.");
        }

        if (participationRepository.countByReservationId(reservationId) >= 4) {
            throw new BusinessException("Reservation is full.");
        }

        if (participationRepository.existsByReservationIdAndMemberId(reservationId, memberId)) {
            throw new BusinessException("Member already joined this reservation.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found."));

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

    public ParticipationDTO payReservation(UUID reservationId, UUID memberId) {
        Participation participation = participationRepository
                .findByReservationIdAndMemberId(reservationId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation not found."));

        participation.setPaid(true);
        participation.setStatus(ParticipationStatus.CONFIRMED);

        Participation savedParticipation = participationRepository.save(participation);

        return participationMapper.toDTO(savedParticipation);
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

    private void validateReservationCreationRules(ReservationDTO reservationDTO, Member organizer) {
        long daysBeforeMatch = getDaysBeforeMatch(reservationDTO.reservationDate());

        if (daysBeforeMatch < 0) {
            throw new BusinessException("You cannot create a reservation in the past.");
        }

        switch (organizer.getType()) {
            case GLOBAL -> validateGlobalMemberBooking(daysBeforeMatch);
            case SITE -> validateSiteMemberBooking(reservationDTO, organizer, daysBeforeMatch);
            case FREE -> validateFreeMemberBooking(daysBeforeMatch);
        }
    }

    private long getDaysBeforeMatch(LocalDate reservationDate) {
        return ChronoUnit.DAYS.between(LocalDate.now(), reservationDate);
    }

    private void validateGlobalMemberBooking(long daysBeforeMatch) {
        if (daysBeforeMatch > 21) {
            throw new BusinessException("Global members can only book up to 3 weeks before the match.");
        }
    }

    private void validateSiteMemberBooking(
            ReservationDTO reservationDTO,
            Member organizer,
            long daysBeforeMatch
    ) {
        if (daysBeforeMatch > 14) {
            throw new BusinessException("Site members can only book up to 2 weeks before the match.");
        }

        if (organizer.getSiteId() == null || !organizer.getSiteId().equals(reservationDTO.siteId().toString())) {
            throw new BusinessException("Site members can only book on their own site.");
        }
    }

    private void validateFreeMemberBooking(long daysBeforeMatch) {
        if (daysBeforeMatch > 5) {
            throw new BusinessException("Free members can only book up to 5 days before the match.");
        }
    }
}