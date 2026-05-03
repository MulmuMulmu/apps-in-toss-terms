package com.team200.graduation_project.domain.user.client;

public interface AppsInTossAccessRemovalClient {

    void removeByUserKey(String accessToken, String userKey);
}
