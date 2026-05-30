package be.ephec.pdw.backend.member;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberType type;

    private String siteId;

    @Column(nullable = false)
    private BigDecimal unpaidBalance;

    private LocalDate blockedUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AdminRole adminRole = AdminRole.NONE;

    private String adminPassword;
}