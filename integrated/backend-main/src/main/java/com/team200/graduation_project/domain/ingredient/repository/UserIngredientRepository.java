package com.team200.graduation_project.domain.ingredient.repository;


import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team200.graduation_project.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

import java.util.UUID;

@Repository
public interface UserIngredientRepository extends JpaRepository<UserIngredient, UUID> {
    List<UserIngredient> findByUserAndIngredient_CategoryIn(User user, List<String> categories, Sort sort);
    List<UserIngredient> findByUser(User user, Sort sort);
    Page<UserIngredient> findByUser(User user, Pageable pageable);
    Page<UserIngredient> findByUserAndIngredient_CategoryIn(User user, List<String> categories, Pageable pageable);
    Page<UserIngredient> findByUserAndIngredient_IngredientNameContainingIgnoreCase(User user, String ingredientName, Pageable pageable);
    Page<UserIngredient> findByUserAndIngredient_CategoryInAndIngredient_IngredientNameContainingIgnoreCase(User user, List<String> categories, String ingredientName, Pageable pageable);
    List<UserIngredient> findByUserAndIngredient_IngredientName(User user, String ingredientName);
    boolean existsByUserAndIngredient(User user, Ingredient ingredient);
    int countByUserAndExpirationDateBetween(User user, java.time.LocalDate startDate, java.time.LocalDate endDate);
    int countByUserAndExpirationDateLessThanEqual(User user, java.time.LocalDate date);
    long countByUser(User user);
    List<UserIngredient> findAllByCreateTimeBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<UserIngredient> findAllByCreateTimeBetweenAndUser_TossUserKeyIsNotNull(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
