package com.team200.graduation_project.domain.ingredient.repository;

import com.team200.graduation_project.domain.ingredient.entity.IngredientExpiryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IngredientExpiryRuleRepository extends JpaRepository<IngredientExpiryRule, UUID> {

    Optional<IngredientExpiryRule> findByIngredientIngredientIdAndStorageMethod(UUID ingredientId, String storageMethod);
}
