package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOcrIngredientResponse {
    private UUID ocrIngredientId;
    private String itemName;
    private String originalItemName;
    private String normalizedItemName;
    private String category;
    private Integer quantity;
}
