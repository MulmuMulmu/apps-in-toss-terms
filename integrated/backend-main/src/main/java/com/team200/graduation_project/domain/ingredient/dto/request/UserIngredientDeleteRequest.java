package com.team200.graduation_project.domain.ingredient.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UserIngredientDeleteRequest {
    private List<UUID> ingredientIds;
}
