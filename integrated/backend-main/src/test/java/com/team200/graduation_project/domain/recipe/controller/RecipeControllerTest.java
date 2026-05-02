package com.team200.graduation_project.domain.recipe.controller;

import com.team200.graduation_project.domain.ai.dto.RecommendationData;
import com.team200.graduation_project.domain.recipe.service.RecipeService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RecipeController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecipeService recipeService;

    @Test
    void recommendRecipesWrapsAiRecommendationEnvelope() throws Exception {
        Mockito.doReturn(ApiResponse.onSuccess(new RecommendationData(
                List.of(new RecommendationData.Recommendation(
                        "exampleUUID1",
                        "돼지고기 김치찌개",
                        0.92,
                        new RecommendationData.MatchDetails(List.of("김치"), List.of("두부"))
                ))
        ))).when(recipeService).recommendRecipes(any());

        mockMvc.perform(post("/recipe/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userIngredient": {
                                    "ingredients": ["김치"],
                                    "preferIngredients": [],
                                    "dispreferIngredients": [],
                                    "IngredientRatio": 0.5
                                  },
                                  "candidates": [
                                    {
                                      "recipe_id": "exampleUUID1",
                                      "title": "돼지고기 김치찌개",
                                      "ingredients": ["김치", "두부"]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result.recommendations[0].recipeId").value("exampleUUID1"))
                .andExpect(jsonPath("$.result.recommendations[0].score").value(0.92));
    }

    @Test
    void currentRecipeAliasUsesRecipeListService() throws Exception {
        Mockito.doReturn(ApiResponse.onSuccess("recipes"))
                .when(recipeService)
                .getRecipes(0, 10, null, null);

        mockMvc.perform(get("/recipe/current"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void recipeStepsAliasUsesRecipeDetailService() throws Exception {
        UUID recipeId = UUID.randomUUID();
        Mockito.doReturn(ApiResponse.onSuccess("detail"))
                .when(recipeService)
                .getRecipeDetail(eq(recipeId));

        mockMvc.perform(get("/recipe/steps").param("recipeId", recipeId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
