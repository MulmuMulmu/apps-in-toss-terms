package com.team200.graduation_project.domain.user.client;

public interface AppsInTossLoginClient {

    AppsInTossUserInfo login(String authorizationCode, String referrer);
}
