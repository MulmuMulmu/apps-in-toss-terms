package com.team200.graduation_project.domain.ai.dto;

import java.util.List;

public record ExpiryPredictionResult(
        String purchaseDate,
        List<IngredientExpiry> ingredients
) {
    public record IngredientExpiry(
            String ingredientName,
            String expirationDate
    ) {
    }
}
