package com.team200.graduation_project.global.jwt;

public record JwtTokenPair(
        String accessToken,
        String refreshToken
) {
}
