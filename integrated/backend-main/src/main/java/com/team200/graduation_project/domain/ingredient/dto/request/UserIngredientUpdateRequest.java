package com.team200.graduation_project.domain.ingredient.dto.request;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserIngredientUpdateRequest {
    private String ingredient;
    private LocalDate purchaseDate;
    private LocalDate expirationDate;
    private String status;
}
