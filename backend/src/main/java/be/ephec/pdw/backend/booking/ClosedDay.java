package be.ephec.pdw.backend.booking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClosedDay {

    @Id
    private UUID id;

    private UUID siteId;

    @Column(nullable = false)
    private LocalDate closedDate;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private boolean active;
}