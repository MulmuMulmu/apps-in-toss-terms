package com.team200.graduation_project.domain.ingredient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.team200.graduation_project.domain.ai.client.AiClient;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionRequest;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionResult;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientExpiryRule;
import com.team200.graduation_project.domain.ingredient.repository.IngredientExpiryRuleRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IngredientExpiryPredictionServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;
    @Mock
    private IngredientExpiryRuleRepository expiryRuleRepository;
    @Mock
    private AiClient aiClient;

    @InjectMocks
    private IngredientExpiryPredictionService ingredientExpiryPredictionService;

    @Test
    void predictCorrectsWeakAiRuleWithDefaultRule() {
        Ingredient milk = Ingredient.builder()
                .ingredientId(UUID.randomUUID())
                .ingredientName("우유")
                .category("유제품")
                .build();
        IngredientExpiryRule weakAiRule = IngredientExpiryRule.builder()
                .ingredient(milk)
                .storageMethod("냉장")
                .shelfLifeDays(7)
                .source("AI")
                .confidence(1.0)
                .build();
        when(ingredientRepository.findByIngredientName("우유")).thenReturn(Optional.of(milk));
        when(expiryRuleRepository.findByIngredientIngredientIdAndStorageMethod(milk.getIngredientId(), "냉장"))
                .thenReturn(Optional.of(weakAiRule));

        ExpiryPredictionResult result = ingredientExpiryPredictionService.predict(new ExpiryPredictionRequest(
                "2026-05-01",
                java.util.List.of("우유")
        ));

        assertThat(result.ingredients()).hasSize(1);
        assertThat(result.ingredients().get(0).expirationDate()).isEqualTo("2026-05-11");
        assertThat(weakAiRule.getShelfLifeDays()).isEqualTo(10);
        assertThat(weakAiRule.getSource()).isEqualTo("DEFAULT_RULE");
        verifyNoInteractions(aiClient);
    }

    @Test
    void predictCreatesCategoryDefaultRuleBeforeCallingAi() {
        Ingredient spinach = Ingredient.builder()
                .ingredientId(UUID.randomUUID())
                .ingredientName("시금치")
                .category("채소/과일")
                .build();
        when(ingredientRepository.findByIngredientName("시금치")).thenReturn(Optional.of(spinach));
        when(expiryRuleRepository.findByIngredientIngredientIdAndStorageMethod(spinach.getIngredientId(), "냉장"))
                .thenReturn(Optional.empty());
        when(expiryRuleRepository.save(any(IngredientExpiryRule.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ExpiryPredictionResult result = ingredientExpiryPredictionService.predict(new ExpiryPredictionRequest(
                "2026-05-01",
                java.util.List.of("시금치")
        ));

        assertThat(result.ingredients()).hasSize(1);
        assertThat(result.ingredients().get(0).expirationDate()).isEqualTo("2026-05-08");
        verifyNoInteractions(aiClient);
    }
}
