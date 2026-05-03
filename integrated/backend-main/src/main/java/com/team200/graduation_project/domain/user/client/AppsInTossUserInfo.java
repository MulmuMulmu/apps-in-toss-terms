package com.team200.graduation_project.domain.user.client;

import java.util.List;

public record AppsInTossUserInfo(
        String userKey,
        String scope,
        List<String> agreedTerms,
        String accessToken,
        String refreshToken,
        Long expiresIn
) {
    public AppsInTossUserInfo(String userKey, String scope, List<String> agreedTerms) {
        this(userKey, scope, agreedTerms, "", "", null);
    }
}
