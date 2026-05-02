package com.team200.graduation_project.domain.ingredient.repository;

import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngredientAliasRepository extends JpaRepository<IngredientAlias, UUID> {

    List<IngredientAlias> findTop10ByAliasNameContaining(String keyword);

    Optional<IngredientAlias> findByNormalizedAliasName(String normalizedAliasName);
}
