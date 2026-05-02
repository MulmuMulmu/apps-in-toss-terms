package com.team200.graduation_project.domain.recipe.repository;

import com.team200.graduation_project.domain.recipe.entity.Recipe;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

    Page<Recipe> findByCategory(String category, Pageable pageable);

    Page<Recipe> findByNameContaining(String keyword, Pageable pageable);

    Page<Recipe> findByCategoryAndNameContaining(String category, String keyword, Pageable pageable);

    @Query("""
            select distinct r
            from Recipe r
            where (:category is null or :category = '' or r.category = :category)
              and (
                :keyword is null or :keyword = ''
                or r.name like concat('%', :keyword, '%')
                or exists (
                    select 1
                    from RecipeIngredient ri
                    left join ri.ingredient ingredient
                    where ri.recipe = r
                      and (
                        ri.sourceIngredientName like concat('%', :keyword, '%')
                        or ingredient.ingredientName like concat('%', :keyword, '%')
                      )
                )
              )
            """)
    Page<Recipe> searchRecipes(
            @Param("category") String category,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
