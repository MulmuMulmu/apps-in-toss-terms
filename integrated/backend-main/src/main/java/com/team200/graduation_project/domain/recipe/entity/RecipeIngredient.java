package com.team200.graduation_project.domain.recipe.entity;

import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "`RecipeIngredient`")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RecipeIngredient {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID recipeIngredientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipeId")
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredientId")
    private Ingredient ingredient;

    @Column(length = 100)
    private String sourceIngredientName;

    private Double amount;

    @Column(length = 20)
    private String unit;
}
