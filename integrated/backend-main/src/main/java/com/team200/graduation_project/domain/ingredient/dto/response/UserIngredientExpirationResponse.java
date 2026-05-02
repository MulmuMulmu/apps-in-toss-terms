package com.team200.graduation_project.domain.ingredient.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class UserIngredientExpirationResponse {
    private Long dDay;
    private List<String> ingredient;
}
