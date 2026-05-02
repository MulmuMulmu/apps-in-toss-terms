package com.team200.graduation_project.domain.recipe.repository;

import com.team200.graduation_project.domain.recipe.entity.RecipeIngredient;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, UUID> {

    List<RecipeIngredient> findByRecipeRecipeId(UUID recipeId);

    @Query("""
            select recipeIngredient
            from RecipeIngredient recipeIngredient
            join fetch recipeIngredient.recipe recipe
            left join fetch recipeIngredient.ingredient ingredient
            """)
    List<RecipeIngredient> findAllWithRecipeAndIngredient();
}
