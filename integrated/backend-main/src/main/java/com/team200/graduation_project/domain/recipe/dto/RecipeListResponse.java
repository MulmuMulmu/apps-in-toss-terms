package com.team200.graduation_project.domain.recipe.dto;

import java.util.List;
import java.util.UUID;

public record RecipeListResponse(
        List<RecipeItem> recipes,
        int page,
        int size,
        boolean hasNext,
        long totalCount
) {
    public record RecipeItem(
            UUID recipeId,
            String name,
            String category,
            String imageUrl,
            List<String> ingredients
    ) {
    }
}
