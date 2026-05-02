package com.team200.graduation_project.domain.share.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ShareStatus {
    AVAILABLE("나눔 가능"),
    COMPLETED("나눔 완료");

    private final String description;
}
