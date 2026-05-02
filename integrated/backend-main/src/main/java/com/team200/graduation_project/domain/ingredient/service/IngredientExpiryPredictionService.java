package com.team200.graduation_project.domain.ingredient.service;

import com.team200.graduation_project.domain.ai.client.AiClient;
import com.team200.graduation_project.domain.ai.client.AiClientException;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionRequest;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionResult;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientExpiryRule;
import com.team200.graduation_project.domain.ingredient.repository.IngredientExpiryRuleRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IngredientExpiryPredictionService {

    private static final String DEFAULT_STORAGE_METHOD = "냉장";
    private static final String AI_SOURCE = "AI";
    private static final String DEFAULT_RULE_SOURCE = "DEFAULT_RULE";
    private static final Double DEFAULT_RULE_CONFIDENCE = 0.85;
    private static final Map<String, Integer> DEFAULT_SHELF_LIFE_BY_NAME = Map.ofEntries(
            Map.entry("우유", 10),
            Map.entry("당근", 21),
            Map.entry("상추", 5),
            Map.entry("배추", 14),
            Map.entry("양파", 30),
            Map.entry("감자", 30),
            Map.entry("대파", 10),
            Map.entry("고추", 7),
            Map.entry("오이", 5),
            Map.entry("마늘", 30),
            Map.entry("계란", 30),
            Map.entry("두부", 7),
            Map.entry("돼지고기", 3),
            Map.entry("소고기", 4),
            Map.entry("닭고기", 2),
            Map.entry("오징어", 2),
            Map.entry("새우", 2),
            Map.entry("고등어", 2),
            Map.entry("김치", 30)
    );
    private static final Map<String, Integer> DEFAULT_SHELF_LIFE_BY_CATEGORY = Map.of(
            "정육/계란", 3,
            "해산물", 2,
            "채소/과일", 7,
            "유제품", 10,
            "쌀/면/빵", 30,
            "소스/조미료/오일", 90,
            "가공식품", 30,
            "기타", 7
    );

    private final IngredientRepository ingredientRepository;
    private final IngredientExpiryRuleRepository expiryRuleRepository;
    private final AiClient aiClient;

    @Transactional
    public ExpiryPredictionResult predict(ExpiryPredictionRequest request) {
        if (request == null || request.purchaseDate() == null || request.ingredients() == null) {
            throw new AiClientException("Invalid expiry prediction request.");
        }

        LocalDate purchaseDate = parseDate(request.purchaseDate());
        List<ExpiryPredictionResult.IngredientExpiry> predictions = new ArrayList<>();

        for (String rawName : request.ingredients()) {
            String ingredientName = normalizeIngredientName(rawName);
            if (ingredientName.isBlank()) {
                continue;
            }

            Ingredient ingredient = ingredientRepository.findByIngredientName(ingredientName)
                    .orElseThrow(() -> new AiClientException("Unknown ingredient: " + ingredientName));

            IngredientExpiryRule rule = expiryRuleRepository
                    .findByIngredientIngredientIdAndStorageMethod(ingredient.getIngredientId(), DEFAULT_STORAGE_METHOD)
                    .map(existingRule -> normalizeExistingRule(existingRule, ingredient))
                    .orElseGet(() -> createRule(ingredient, purchaseDate));

            predictions.add(new ExpiryPredictionResult.IngredientExpiry(
                    ingredientName,
                    purchaseDate.plusDays(rule.getShelfLifeDays()).toString()
            ));
        }

        return new ExpiryPredictionResult(request.purchaseDate(), predictions);
    }

    private IngredientExpiryRule normalizeExistingRule(IngredientExpiryRule rule, Ingredient ingredient) {
        Optional<Integer> defaultShelfLifeDays = resolveDefaultShelfLifeDays(ingredient);
        if (defaultShelfLifeDays.isPresent()
                && AI_SOURCE.equals(rule.getSource())
                && !defaultShelfLifeDays.get().equals(rule.getShelfLifeDays())) {
            rule.updateRule(defaultShelfLifeDays.get(), DEFAULT_RULE_SOURCE, DEFAULT_RULE_CONFIDENCE);
        }
        return rule;
    }

    private IngredientExpiryRule createRule(Ingredient ingredient, LocalDate purchaseDate) {
        Optional<Integer> defaultShelfLifeDays = resolveDefaultShelfLifeDays(ingredient);
        if (defaultShelfLifeDays.isPresent()) {
            return expiryRuleRepository.save(IngredientExpiryRule.builder()
                    .ingredient(ingredient)
                    .storageMethod(DEFAULT_STORAGE_METHOD)
                    .shelfLifeDays(defaultShelfLifeDays.get())
                    .source(DEFAULT_RULE_SOURCE)
                    .confidence(DEFAULT_RULE_CONFIDENCE)
                    .build());
        }

        return createRuleFromAi(ingredient, purchaseDate);
    }

    private IngredientExpiryRule createRuleFromAi(Ingredient ingredient, LocalDate purchaseDate) {
        ExpiryPredictionResult aiResult = aiClient.predictExpiry(new ExpiryPredictionRequest(
                purchaseDate.toString(),
                List.of(ingredient.getIngredientName())
        ));

        String expirationDate = aiResult.ingredients().stream()
                .filter(result -> ingredient.getIngredientName().equals(result.ingredientName()))
                .findFirst()
                .or(() -> aiResult.ingredients().stream().findFirst())
                .map(ExpiryPredictionResult.IngredientExpiry::expirationDate)
                .orElseThrow(() -> new AiClientException("AI expiry prediction result is empty."));

        long shelfLifeDays = ChronoUnit.DAYS.between(purchaseDate, parseDate(expirationDate));
        if (shelfLifeDays < 0 || shelfLifeDays > 3650) {
            throw new AiClientException("AI expiry prediction result is out of range.");
        }

        return expiryRuleRepository.save(IngredientExpiryRule.builder()
                .ingredient(ingredient)
                .storageMethod(DEFAULT_STORAGE_METHOD)
                .shelfLifeDays((int) shelfLifeDays)
                .source(AI_SOURCE)
                .confidence(1.0)
                .build());
    }

    private Optional<Integer> resolveDefaultShelfLifeDays(Ingredient ingredient) {
        Integer exactMatch = DEFAULT_SHELF_LIFE_BY_NAME.get(ingredient.getIngredientName());
        if (exactMatch != null) {
            return Optional.of(exactMatch);
        }

        String category = ingredient.getCategory();
        if (category == null || category.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(DEFAULT_SHELF_LIFE_BY_CATEGORY.get(category));
    }

    private String normalizeIngredientName(String value) {
        return value == null ? "" : value.trim();
    }

    private LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new AiClientException("Invalid date: " + value, e);
        }
    }
}
