package com.team200.graduation_project.domain.recipe.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum RecipeErrorCode {

    RECIPE_BAD_REQUEST(HttpStatus.BAD_REQUEST, "RECIPE400", "잘못된 요청입니다."),
    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "RECIPE404", "리소스를 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
