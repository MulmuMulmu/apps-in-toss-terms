package com.team200.graduation_project.domain.user.dto.request;

public record TossLoginRequest(
        String authorizationCode,
        String referrer
) {
}
