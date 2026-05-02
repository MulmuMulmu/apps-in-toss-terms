package com.team200.graduation_project.domain.ingredient.service;

import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import com.team200.graduation_project.domain.ingredient.repository.IngredientAliasRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IngredientServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private IngredientAliasRepository ingredientAliasRepository;

    @InjectMocks
    private IngredientService ingredientService;

    @Test
    void searchIngredientsSuggestsCanonicalIngredientWhenKeywordContainsIngredientName() {
        when(ingredientRepository.findTop10ByIngredientNameContaining("서울우유")).thenReturn(List.of());
        when(ingredientAliasRepository.findTop10ByAliasNameContaining("서울우유")).thenReturn(List.of());
        when(ingredientRepository.findAll()).thenReturn(List.of(
                ingredient("우유", "유제품"),
                ingredient("대파", "채소/과일")
        ));

        var response = ingredientService.searchIngredients("서울우유");

        assertThat(response.getIngredientNames()).containsExactly("우유");
    }

    @Test
    void searchIngredientsKeepsDirectMatchesBeforeReverseCanonicalMatches() {
        when(ingredientRepository.findTop10ByIngredientNameContaining("우유")).thenReturn(List.of(
                ingredient("우유", "유제품")
        ));
        when(ingredientAliasRepository.findTop10ByAliasNameContaining("우유")).thenReturn(List.of());
        when(ingredientRepository.findAll()).thenReturn(List.of(
                ingredient("저지방우유", "유제품"),
                ingredient("대파", "채소/과일")
        ));

        var response = ingredientService.searchIngredients("우유");

        assertThat(response.getIngredientNames()).startsWith("우유");
    }

    @Test
    void searchIngredientsUsesAliasDictionaryBeforeReverseContainmentFallback() {
        Ingredient milk = ingredient("우유", "유제품");
        when(ingredientRepository.findTop10ByIngredientNameContaining("맛있는우유GT")).thenReturn(List.of());
        when(ingredientAliasRepository.findTop10ByAliasNameContaining("맛있는우유GT")).thenReturn(List.of(
                alias("맛있는우유GT", milk)
        ));
        when(ingredientAliasRepository.findByNormalizedAliasName("맛있는우유gt")).thenReturn(java.util.Optional.empty());

        var response = ingredientService.searchIngredients("맛있는우유GT");

        assertThat(response.getIngredientNames()).containsExactly("우유");
    }

    @Test
    void searchIngredientsRejectsBlankKeyword() {
        assertThatThrownBy(() -> ingredientService.searchIngredients(" "))
                .isInstanceOf(GeneralException.class);
    }

    @Test
    void listIngredientsByCategoryReturnsCanonicalNamesInCategory() {
        when(ingredientRepository.findByCategoryOrderByIngredientNameAsc("정육/계란")).thenReturn(List.of(
                ingredient("돼지고기", "정육/계란"),
                ingredient("삼겹살", "정육/계란"),
                ingredient("소고기", "정육/계란")
        ));

        var response = ingredientService.listIngredientsByCategory("정육/계란");

        assertThat(response.getIngredientNames()).containsExactly("돼지고기", "삼겹살", "소고기");
    }

    @Test
    void listIngredientsByCategoryRejectsBlankCategory() {
        assertThatThrownBy(() -> ingredientService.listIngredientsByCategory(" "))
                .isInstanceOf(GeneralException.class);
    }

    private Ingredient ingredient(String name, String category) {
        return Ingredient.builder()
                .ingredientName(name)
                .category(category)
                .build();
    }

    private IngredientAlias alias(String aliasName, Ingredient ingredient) {
        return IngredientAlias.builder()
                .aliasName(aliasName)
                .normalizedAliasName(IngredientAlias.normalize(aliasName))
                .ingredient(ingredient)
                .source("test")
                .build();
    }
}
