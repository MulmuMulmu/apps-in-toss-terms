package com.team200.graduation_project.domain.recipe.dto;

import java.util.List;
import java.util.UUID;

public record RecipeDetailResponse(
        UUID recipeId,
        String name,
        String category,
        String imageUrl,
        List<IngredientItem> ingredients,
        List<StepItem> steps
) {
    public record IngredientItem(
            String ingredientName,
            Double amount,
            String unit
    ) {
    }

    public record StepItem(
            Long stepOrder,
            String description
    ) {
    }
}
