package com.team200.graduation_project.domain.recipe.repository;

import com.team200.graduation_project.domain.recipe.entity.RecipeStep;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeStepRepository extends JpaRepository<RecipeStep, UUID> {

    List<RecipeStep> findByRecipeRecipeIdOrderByStepOrderAsc(UUID recipeId);

}
