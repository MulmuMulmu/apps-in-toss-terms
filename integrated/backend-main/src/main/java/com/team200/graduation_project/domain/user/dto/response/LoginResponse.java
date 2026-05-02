package com.team200.graduation_project.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private final String jwt;
    private final Boolean firstLogin;
}
