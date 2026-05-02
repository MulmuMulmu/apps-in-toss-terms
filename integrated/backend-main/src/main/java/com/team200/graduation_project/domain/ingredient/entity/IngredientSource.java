package com.team200.graduation_project.domain.ingredient.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IngredientSource {
    OCR("OCR 스캔"),
    MANUAL("수동 입력"),
    SHARE("나눔 받음");

    private final String description;
}
