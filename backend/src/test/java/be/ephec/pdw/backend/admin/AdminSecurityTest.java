package be.ephec.pdw.backend.admin;

import be.ephec.pdw.backend.config.JwtUtil;
import be.ephec.pdw.backend.member.AdminRole;
import be.ephec.pdw.backend.member.Member;
import be.ephec.pdw.backend.member.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MemberRepository memberRepository;

    @Test
    void adminMembersIsRejectedWithoutToken() throws Exception {
        mockMvc.perform(get("/admin/members"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void adminMembersIsAcceptedWithGlobalAdminToken() throws Exception {
        Member globalAdmin = memberRepository.findByMatricule("G0001")
                .orElseThrow();

        String token = jwtUtil.generateAdminToken(
                globalAdmin.getId(),
                globalAdmin.getMatricule(),
                globalAdmin.getAdminRole()
        );

        mockMvc.perform(get("/admin/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void adminMembersIsRejectedWithNonAdminToken() throws Exception {
        Member normalMember = memberRepository.findByMatricule("G0002")
                .orElseThrow();

        String token = jwtUtil.generateAdminToken(
                normalMember.getId(),
                normalMember.getMatricule(),
                AdminRole.NONE
        );

        mockMvc.perform(get("/admin/members")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().is4xxClientError());
    }
}