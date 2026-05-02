package com.team200.graduation_project.domain.user.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserException extends RuntimeException {

    private final UserErrorCode status;

    @Override
    public String getMessage() {
        return status.getMessage();
    }
}
