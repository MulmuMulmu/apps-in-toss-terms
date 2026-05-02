package com.team200.graduation_project.domain.share.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportStatus {
    NOT_COMPLETED("미완"),
    COMPLETED("완료");

    private final String description;
}
