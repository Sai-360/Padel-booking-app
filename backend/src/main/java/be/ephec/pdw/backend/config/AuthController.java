package be.ephec.pdw.backend.config;

import be.ephec.pdw.backend.exception.BusinessException;
import be.ephec.pdw.backend.member.AdminRole;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping(value = "/admin/login", consumes = "application/json", produces = "application/json")
    public LoginResponse login(@RequestBody LoginRequest request) {
        Member member = memberRepository.findByMatricule(request.matricule())
                .orElseThrow(() -> new BusinessException("Invalid admin credentials."));

        if (member.getAdminRole() == null || member.getAdminRole() == AdminRole.NONE) {
            throw new BusinessException("Invalid admin credentials.");
        }

        if (member.getAdminPassword() == null ||
                !passwordEncoder.matches(request.password(), member.getAdminPassword())) {
            throw new BusinessException("Invalid admin credentials.");
        }

        String accessToken = jwtUtil.generateAdminToken(
                member.getId(),
                member.getMatricule(),
                member.getAdminRole()
        );

        return new LoginResponse(
                accessToken,
                member.getId().toString(),
                member.getMatricule(),
                member.getName(),
                member.getAdminRole().name()
        );
    }

    public record LoginRequest(
            String matricule,
            String password
    ) {
    }

    public record LoginResponse(
            String accessToken,
            String memberId,
            String matricule,
            String name,
            String adminRole
    ) {
    }
}