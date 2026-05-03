package com.team200.graduation_project.domain.ingredient.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class UserIngredientSearchResponse {
    private UUID userIngredientId;
    private Integer sortRank;
    private String ingredient;
    private String category;
    private String status;
    private Long dDay;
    private LocalDate purchaseDate;
    private LocalDate expirationDate;
}
