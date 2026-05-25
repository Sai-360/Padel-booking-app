package be.ephec.pdw.backend.reservation;

import org.springframework.stereotype.Component;

@Component
public class ParticipationMapper {

    public ParticipationDTO toDTO(Participation participation) {
        return new ParticipationDTO(
                participation.getId(),
                participation.getReservationId(),
                participation.getMemberId(),
                participation.getMemberName(),
                participation.getRole(),
                participation.isPaid(),
                participation.getStatus()
        );
    }
}