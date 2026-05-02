package com.team200.graduation_project.domain.share.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ShareException extends RuntimeException {

    private final ShareErrorCode status;

    @Override
    public String getMessage() {
        return status.getMessage();
    }
}
