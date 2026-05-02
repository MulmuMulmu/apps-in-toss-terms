package com.team200.graduation_project.domain.user.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserSignupRequest {

    private String name;
    private String id;
    private String password;

    @JsonProperty("check_password")
    private String checkPassword;
}
