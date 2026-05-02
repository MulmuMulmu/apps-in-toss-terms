package com.team200.graduation_project.domain.ingredient.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserIngredientStatus {
    NORMAL("정상");

    private final String description;
}
