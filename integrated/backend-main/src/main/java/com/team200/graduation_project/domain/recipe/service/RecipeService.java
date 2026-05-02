package com.team200.graduation_project.domain.recipe.service;

import com.team200.graduation_project.domain.ai.client.AiClient;
import com.team200.graduation_project.domain.ai.client.AiClientException;
import com.team200.graduation_project.domain.ai.dto.RecommendationRequest;
import com.team200.graduation_project.domain.recipe.dto.RecipeDetailResponse;
import com.team200.graduation_project.domain.recipe.dto.RecipeListResponse;
import com.team200.graduation_project.domain.recipe.entity.Recipe;
import com.team200.graduation_project.domain.recipe.entity.RecipeIngredient;
import com.team200.graduation_project.domain.recipe.repository.RecipeIngredientRepository;
import com.team200.graduation_project.domain.recipe.repository.RecipeRepository;
import com.team200.graduation_project.domain.recipe.repository.RecipeStepRepository;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final AiClient aiClient;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository;

    public ApiResponse<?> getRecipes(int page, int size, String category, String keyword) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name"));
        Page<Recipe> recipePage = findRecipePage(category, keyword, pageable);
        List<Recipe> recipeEntities = recipePage.getContent();
        Map<UUID, List<RecipeIngredient>> ingredientsByRecipeId = loadIngredientsByRecipeId(recipeEntities);

        List<RecipeListResponse.RecipeItem> recipes = recipeEntities.stream()
                .map(recipe -> new RecipeListResponse.RecipeItem(
                        recipe.getRecipeId(),
                        recipe.getName(),
                        recipe.getCategory(),
                        recipe.getImageUrl(),
                        ingredientNames(ingredientsByRecipeId.get(recipe.getRecipeId())).stream()
                                .limit(6)
                                .toList()
                ))
                .toList();

        return ApiResponse.onSuccess(new RecipeListResponse(
                recipes,
                recipePage.getNumber(),
                recipePage.getSize(),
                recipePage.hasNext(),
                recipePage.getTotalElements()
        ));
    }

    private Page<Recipe> findRecipePage(String category, String keyword, Pageable pageable) {
        boolean hasCategory = StringUtils.hasText(category) && !"전체".equals(category);
        boolean hasKeyword = StringUtils.hasText(keyword);
        if (hasCategory || hasKeyword) {
            return recipeRepository.searchRecipes(
                    hasCategory ? category.trim() : null,
                    hasKeyword ? keyword.trim() : null,
                    pageable
            );
        }
        return recipeRepository.findAll(pageable);
    }

    public ApiResponse<?> recommendRecipes(RecommendationRequest request) {
        try {
            return ApiResponse.onSuccess(aiClient.recommendRecipes(withDatabaseCandidates(request)));
        } catch (AiClientException e) {
            return ApiResponse.onFailure("AI500", "레시피를 추천할 수 없습니다.");
        }
    }

    public ApiResponse<?> getRecipeDetail(UUID recipeId) {
        return recipeRepository.findById(recipeId)
                .<ApiResponse<?>>map(recipe -> ApiResponse.onSuccess(toDetailResponse(recipe)))
                .orElseGet(() -> ApiResponse.onFailure("RECIPE404", "레시피를 찾을 수 없습니다."));
    }

    private RecommendationRequest withDatabaseCandidates(RecommendationRequest request) {
        if (request.candidates() != null && !request.candidates().isEmpty()) {
            return request;
        }

        List<Recipe> recipes = recipeRepository.findAll();
        Map<UUID, List<RecipeIngredient>> ingredientsByRecipeId = loadIngredientsByRecipeId(recipes);

        List<RecommendationRequest.Candidate> candidates = recipes.stream()
                .map(recipe -> new RecommendationRequest.Candidate(
                        recipe.getRecipeId().toString(),
                        recipe.getName(),
                        ingredientNames(ingredientsByRecipeId.get(recipe.getRecipeId()))
                ))
                .filter(candidate -> !candidate.ingredients().isEmpty())
                .toList();

        return new RecommendationRequest(request.userIngredient(), candidates);
    }

    private Map<UUID, List<RecipeIngredient>> loadIngredientsByRecipeId(List<Recipe> recipes) {
        if (recipes.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<UUID> recipeIds = recipes.stream()
                .map(Recipe::getRecipeId)
                .collect(Collectors.toSet());

        return recipeIngredientRepository.findAllWithRecipeAndIngredient().stream()
                .filter(recipeIngredient -> recipeIds.contains(recipeIngredient.getRecipe().getRecipeId()))
                .collect(Collectors.groupingBy(recipeIngredient -> recipeIngredient.getRecipe().getRecipeId()));
    }

    private List<String> ingredientNames(List<RecipeIngredient> recipeIngredients) {
        if (recipeIngredients == null || recipeIngredients.isEmpty()) {
            return List.of();
        }

        return recipeIngredients.stream()
                .map(this::displayIngredientName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
    }

    private String displayIngredientName(RecipeIngredient recipeIngredient) {
        if (recipeIngredient.getSourceIngredientName() != null
                && !recipeIngredient.getSourceIngredientName().isBlank()) {
            return recipeIngredient.getSourceIngredientName();
        }
        return recipeIngredient.getIngredient() == null ? null : recipeIngredient.getIngredient().getIngredientName();
    }

    private RecipeDetailResponse toDetailResponse(Recipe recipe) {
        List<RecipeDetailResponse.IngredientItem> ingredients = recipeIngredientRepository
                .findByRecipeRecipeId(recipe.getRecipeId())
                .stream()
                .map(item -> new RecipeDetailResponse.IngredientItem(
                        displayIngredientName(item),
                        item.getAmount(),
                        item.getUnit()
                ))
                .toList();

        List<RecipeDetailResponse.StepItem> steps = recipeStepRepository
                .findByRecipeRecipeIdOrderByStepOrderAsc(recipe.getRecipeId())
                .stream()
                .map(step -> new RecipeDetailResponse.StepItem(step.getStepOrder(), step.getDescription()))
                .toList();

        return new RecipeDetailResponse(
                recipe.getRecipeId(),
                recipe.getName(),
                recipe.getCategory(),
                recipe.getImageUrl(),
                ingredients,
                steps
        );
    }
}
