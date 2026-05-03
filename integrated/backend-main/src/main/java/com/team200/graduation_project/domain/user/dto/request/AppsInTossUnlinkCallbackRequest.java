package com.team200.graduation_project.domain.user.dto.request;

public record AppsInTossUnlinkCallbackRequest(
        String userKey,
        String referrer
) {
}
