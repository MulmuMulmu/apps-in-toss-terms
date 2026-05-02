package com.team200.graduation_project.domain.ai.dto;

import java.util.List;

public record RecommendationData(
        List<Recommendation> recommendations
) {
    public record Recommendation(
            String recipeId,
            String title,
            Double score,
            MatchDetails match_details
    ) {
    }

    public record MatchDetails(
            List<String> matched,
            List<String> missing
    ) {
    }
}
