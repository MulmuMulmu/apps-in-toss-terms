package com.team200.graduation_project.domain.admin.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminException extends RuntimeException {
    private final AdminErrorCode status;

    @Override
    public String getMessage() {
        return status.getMessage();
    }
}
