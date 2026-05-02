package com.team200.graduation_project.domain.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RecommendationRequest(
        UserIngredient userIngredient,
        List<Candidate> candidates
) {
    public record UserIngredient(
            List<String> ingredients,
            List<String> preferIngredients,
            List<String> dispreferIngredients,
            @JsonProperty("IngredientRatio")
            Double IngredientRatio
    ) {
    }

    public record Candidate(
            String recipe_id,
            String title,
            List<String> ingredients
    ) {
    }
}
