package be.ephec.pdw.backend.reservation;

import org.springframework.stereotype.Service;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.exception.ResourceNotFoundException;

import java.util.List;
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

    public List<ReservationDTO> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public ReservationDTO getReservationById(UUID id) {
        return reservationRepository.findById(id)
                .map(reservationMapper::toDTO)
                .orElseThrow();
    }

    public List<ReservationDTO> getPublicReservations() {
        return reservationRepository.findByType(ReservationType.PUBLIC)
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public List<ReservationDTO> getReservationsByOrganizerId(UUID organizerId) {
        return reservationRepository.findByOrganizerId(organizerId)
                .stream()
                .map(reservationMapper::toDTO)
                .toList();
    }

    public ReservationDTO createReservation(ReservationDTO reservationDTO) {
        Reservation reservation = reservationMapper.toEntity(reservationDTO);
        Reservation savedReservation = reservationRepository.save(reservation);

        return reservationMapper.toDTO(savedReservation);
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


}