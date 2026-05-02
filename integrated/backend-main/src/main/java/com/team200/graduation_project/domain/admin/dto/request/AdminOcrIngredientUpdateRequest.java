package com.team200.graduation_project.domain.admin.dto.request;

import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOcrIngredientUpdateRequest {
    private UUID ocrId;
    private Double accuracy;
    private List<Item> items;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private UUID ocrIngredientId;
        private String itemName;
        private Integer quantity;
    }
}
