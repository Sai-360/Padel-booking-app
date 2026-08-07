package be.ephec.pdw.backend.booking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRule {

    @Id
    private UUID id;

    @Column(nullable = false)
    private BigDecimal matchPrice;

    @Column(nullable = false)
    private int maxPlayers;

    @Column(nullable = false)
    private int globalBookingLimitDays;

    @Column(nullable = false)
    private int siteBookingLimitDays;

    @Column(nullable = false)
    private int freeBookingLimitDays;

    @Column(nullable = false)
    private BigDecimal penaltyAmountPerMissingPlayer;

    @Column(nullable = false)
    private int privatePenaltyBlockDays;

    @Column(nullable = false)
    private int penaltyCheckDaysBeforeMatch;
}