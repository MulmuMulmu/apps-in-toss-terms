package com.team200.graduation_project.domain.ai.dto;

import java.util.List;

public record ExpiryPredictionRequest(
        String purchaseDate,
        List<String> ingredients
) {
}
