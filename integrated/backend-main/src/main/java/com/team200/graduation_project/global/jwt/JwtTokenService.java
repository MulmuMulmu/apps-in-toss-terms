package com.team200.graduation_project.global.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtTokenPair issueTokenPair(String subject) {
        String accessToken = jwtTokenProvider.generateAccessToken(subject);
        String refreshToken = jwtTokenProvider.generateRefreshToken(subject);
        return new JwtTokenPair(accessToken, refreshToken);
    }
}


