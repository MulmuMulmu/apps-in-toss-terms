package com.team200.graduation_project.domain.user.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangePasswordRequest {

    private String oldPassword;
    private String newPassword;
}

