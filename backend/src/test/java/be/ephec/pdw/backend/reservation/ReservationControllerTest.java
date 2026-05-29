package be.ephec.pdw.backend.reservation;

import be.ephec.pdw.backend.AbstractWebTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReservationController.class)
class ReservationControllerTest extends AbstractWebTest {

    @MockitoBean
    private ReservationService reservationService;

    private final UUID currentUserId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID memberId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID reservationId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private final UUID siteId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID courtId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Test
    void getPublicReservationsReturnsReservations() throws Exception {
        ReservationDTO reservationDTO = createReservationDTO(
                reservationId,
                currentUserId,
                ReservationType.PUBLIC,
                1,
                true,
                false
        );

        when(reservationService.getPublicReservations(currentUserId))
                .thenReturn(List.of(reservationDTO));

        mockMvc.perform(get("/reservations/public")
                        .param("currentUserId", currentUserId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(reservationId.toString()))
                .andExpect(jsonPath("$[0].type").value("PUBLIC"))
                .andExpect(jsonPath("$[0].participantsCount").value(1))
                .andExpect(jsonPath("$[0].currentUserJoined").value(true))
                .andExpect(jsonPath("$[0].currentUserPaid").value(false));
    }

    @Test
    void getReservationByIdReturnsReservation() throws Exception {
        ReservationDTO reservationDTO = createReservationDTO(
                reservationId,
                currentUserId,
                ReservationType.PUBLIC,
                0,
                false,
                false
        );

        when(reservationService.getReservationById(reservationId, currentUserId))
                .thenReturn(reservationDTO);

        mockMvc.perform(get("/reservations/{id}", reservationId)
                        .param("currentUserId", currentUserId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reservationId.toString()))
                .andExpect(jsonPath("$.siteId").value(siteId.toString()))
                .andExpect(jsonPath("$.courtId").value(courtId.toString()))
                .andExpect(jsonPath("$.organizerId").value(currentUserId.toString()))
                .andExpect(jsonPath("$.type").value("PUBLIC"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.price").value(60))
                .andExpect(jsonPath("$.participantsCount").value(0));
    }

    @Test
    void getReservationsByMemberIdReturnsReservations() throws Exception {
        ReservationDTO reservationDTO = createReservationDTO(
                reservationId,
                currentUserId,
                ReservationType.PUBLIC,
                1,
                true,
                true
        );

        when(reservationService.getReservationsByMemberId(memberId))
                .thenReturn(List.of(reservationDTO));

        mockMvc.perform(get("/reservations/member/{memberId}", memberId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(reservationId.toString()))
                .andExpect(jsonPath("$[0].currentUserJoined").value(true))
                .andExpect(jsonPath("$[0].currentUserPaid").value(true));
    }

    @Test
    void createReservationReturnsCreatedReservation() throws Exception {
        ReservationDTO reservationDTO = createReservationDTO(
                reservationId,
                currentUserId,
                ReservationType.PUBLIC,
                0,
                false,
                false
        );

        when(reservationService.createReservation(any(ReservationDTO.class)))
                .thenReturn(reservationDTO);

        String requestBody = """
                {
                  "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                  "siteId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                  "courtId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                  "organizerId": "11111111-1111-1111-1111-111111111111",
                  "reservationDate": "%s",
                  "startTime": "10:30:00",
                  "type": "PUBLIC",
                  "status": "ACTIVE",
                  "price": 60,
                  "participantsCount": 0,
                  "currentUserJoined": false,
                  "currentUserPaid": false
                }
                """.formatted(LocalDate.now().plusDays(5));

        mockMvc.perform(post("/reservations")
                        .contentType(APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reservationId.toString()))
                .andExpect(jsonPath("$.type").value("PUBLIC"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void joinReservationReturnsParticipation() throws Exception {
        ParticipationDTO participationDTO = new ParticipationDTO(
                UUID.fromString("99999999-9999-9999-9999-999999999999"),
                reservationId,
                memberId,
                "Site Member",
                ParticipationRole.PLAYER,
                false,
                ParticipationStatus.PENDING
        );

        when(reservationService.joinReservation(eq(reservationId), eq(memberId)))
                .thenReturn(participationDTO);

        String requestBody = """
                {
                  "memberId": "22222222-2222-2222-2222-222222222222"
                }
                """;

        mockMvc.perform(post("/reservations/{id}/join", reservationId)
                        .contentType(APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(reservationId.toString()))
                .andExpect(jsonPath("$.memberId").value(memberId.toString()))
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void payReservationReturnsConfirmedParticipation() throws Exception {
        ParticipationDTO participationDTO = new ParticipationDTO(
                UUID.fromString("99999999-9999-9999-9999-999999999999"),
                reservationId,
                memberId,
                "Site Member",
                ParticipationRole.PLAYER,
                true,
                ParticipationStatus.CONFIRMED
        );

        when(reservationService.payReservation(eq(reservationId), eq(memberId)))
                .thenReturn(participationDTO);

        String requestBody = """
                {
                  "memberId": "22222222-2222-2222-2222-222222222222"
                }
                """;

        mockMvc.perform(post("/reservations/{id}/pay", reservationId)
                        .contentType(APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(reservationId.toString()))
                .andExpect(jsonPath("$.memberId").value(memberId.toString()))
                .andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    private ReservationDTO createReservationDTO(
            UUID reservationId,
            UUID organizerId,
            ReservationType type,
            long participantsCount,
            boolean currentUserJoined,
            boolean currentUserPaid
    ) {
        return new ReservationDTO(
                reservationId,
                siteId,
                courtId,
                organizerId,
                LocalDate.now().plusDays(5),
                LocalTime.of(10, 30),
                type,
                ReservationStatus.ACTIVE,
                BigDecimal.valueOf(60),
                participantsCount,
                currentUserJoined,
                currentUserPaid
        );
    }
}