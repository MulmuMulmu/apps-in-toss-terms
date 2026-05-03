package com.team200.graduation_project.domain.ingredient.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserIngredientStatus {
    NORMAL("미사용"),
    UNUSED("미사용"),
    IN_USE("사용 중"),
    USED("사용 완료");

    private final String description;

    public static UserIngredientStatus fromClientValue(String value) {
        if (value == null || value.isBlank()) {
            return NORMAL;
        }
        for (UserIngredientStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim()) || status.description.equals(value.trim())) {
                return status;
            }
        }
        return switch (value.trim()) {
            case "미사용" -> UNUSED;
            case "사용중", "사용 중" -> IN_USE;
            case "사용완료", "사용 완료" -> USED;
            default -> NORMAL;
        };
    }
}
