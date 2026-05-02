package com.team200.graduation_project.domain.ingredient.repository;

import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, UUID> {

    List<Ingredient> findTop10ByIngredientNameContaining(String keyword);

    List<Ingredient> findByCategoryOrderByIngredientNameAsc(String category);

    Optional<Ingredient> findByIngredientName(String ingredientName);
}
