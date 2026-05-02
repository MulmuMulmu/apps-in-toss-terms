package com.team200.graduation_project.domain.recipe.controller;

import com.team200.graduation_project.domain.ai.dto.RecommendationRequest;
import com.team200.graduation_project.domain.recipe.service.RecipeService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/recipe")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public ApiResponse<?> getRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword
    ) {
        return recipeService.getRecipes(page, size, category, keyword);
    }

    @GetMapping("/current")
    public ApiResponse<?> getCurrentRecipes() {
        return recipeService.getRecipes(0, 10, null, null);
    }

    @PostMapping("/recommendations")
    public ApiResponse<?> recommendRecipes(@RequestBody RecommendationRequest request) {
        return recipeService.recommendRecipes(request);
    }

    @GetMapping("/steps")
    public ApiResponse<?> getRecipeSteps(@RequestParam UUID recipeId) {
        return recipeService.getRecipeDetail(recipeId);
    }

    @GetMapping("/{recipeId}")
    public ApiResponse<?> getRecipeDetail(@PathVariable UUID recipeId) {
        return recipeService.getRecipeDetail(recipeId);
    }
}
