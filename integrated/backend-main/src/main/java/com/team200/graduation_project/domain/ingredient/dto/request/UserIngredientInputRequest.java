package com.team200.graduation_project.domain.ingredient.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserIngredientInputRequest {
    private String ingredient;
    private LocalDate purchaseDate;
    private LocalDate expirationDate;
    private String category;
}
