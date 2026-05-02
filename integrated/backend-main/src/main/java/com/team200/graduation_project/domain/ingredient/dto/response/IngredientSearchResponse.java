package com.team200.graduation_project.domain.ingredient.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class IngredientSearchResponse {

    private final List<String> ingredientNames;
}
