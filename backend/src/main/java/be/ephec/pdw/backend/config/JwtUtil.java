package be.ephec.pdw.backend.config;

import be.ephec.pdw.backend.member.AdminRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String ADMIN_ROLE_CLAIM = "adminRole";
    private static final String MATRICULE_CLAIM = "matricule";

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAdminToken(UUID memberId, String matricule, AdminRole adminRole) {
        return Jwts.builder()
                .subject(memberId.toString())
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .claim(MATRICULE_CLAIM, matricule)
                .claim(ADMIN_ROLE_CLAIM, adminRole.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public UUID extractMemberId(String token) {
        return UUID.fromString(getClaims(token).getSubject());
    }

    public String extractMatricule(String token) {
        return getClaims(token).get(MATRICULE_CLAIM, String.class);
    }

    public String extractAdminRole(String token) {
        return getClaims(token).get(ADMIN_ROLE_CLAIM, String.class);
    }

    public boolean isAccessToken(String token) {
        return ACCESS_TOKEN_TYPE.equals(getClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
    }

    public boolean isTokenExpired(String token) {
        try {
            return getClaims(token).getExpiration().before(new Date());
        } catch (ExpiredJwtException exception) {
            return true;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            return isAccessToken(token) && !isTokenExpired(token);
        } catch (Exception exception) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}