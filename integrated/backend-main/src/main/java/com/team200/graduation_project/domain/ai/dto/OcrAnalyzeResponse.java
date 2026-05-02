package com.team200.graduation_project.domain.ai.dto;

import java.util.List;

public record OcrAnalyzeResponse(
        String purchased_at,
        List<FoodItem> food_items
) {
    public record FoodItem(
            String product_name,
            String raw_product_name,
            String ingredientId,
            String ingredientName,
            String normalized_name,
            String mapping_status,
            String mapping_source,
            Double mapping_confidence,
            String category,
            Integer quantity
    ) {
        public FoodItem(String product_name, String category, Integer quantity) {
            this(
                    product_name,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    category,
                    quantity
            );
        }
    }
}
