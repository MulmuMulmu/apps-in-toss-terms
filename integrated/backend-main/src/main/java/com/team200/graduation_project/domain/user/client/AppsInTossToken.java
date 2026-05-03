package com.team200.graduation_project.domain.user.client;

public record AppsInTossToken(
        String accessToken,
        String refreshToken,
        Long expiresIn
) {
}
