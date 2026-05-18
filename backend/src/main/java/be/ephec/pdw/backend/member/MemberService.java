package be.ephec.pdw.backend.member;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberMapper memberMapper;

    public MemberService(MemberRepository memberRepository, MemberMapper memberMapper) {
        this.memberRepository = memberRepository;
        this.memberMapper = memberMapper;
    }

    public List<MemberDTO> getAllMembers() {
        return memberRepository.findAll()
                .stream()
                .map(memberMapper::toDTO)
                .toList();
    }

    public MemberDTO getMemberByMatricule(String matricule) {
        return memberRepository.findByMatricule(matricule)
                .map(memberMapper::toDTO)
                .orElseThrow();
    }
}