package com.team200.graduation_project.domain.ingredient.service;

import com.team200.graduation_project.domain.ingredient.dto.response.IngredientSearchResponse;
import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import com.team200.graduation_project.domain.ingredient.repository.IngredientAliasRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final IngredientAliasRepository ingredientAliasRepository;

    @Transactional(readOnly = true)
    public IngredientSearchResponse searchIngredients(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        String trimmedKeyword = keyword.trim();
        LinkedHashSet<String> ingredientNames = new LinkedHashSet<>();
        ingredientRepository.findTop10ByIngredientNameContaining(trimmedKeyword)
                .stream()
                .map(ingredient -> ingredient.getIngredientName())
                .forEach(ingredientNames::add);
        ingredientAliasRepository.findTop10ByAliasNameContaining(trimmedKeyword)
                .stream()
                .map(IngredientAlias::getIngredient)
                .map(ingredient -> ingredient.getIngredientName())
                .forEach(ingredientNames::add);

        String normalizedKeyword = normalizeForSearch(trimmedKeyword);
        ingredientAliasRepository.findByNormalizedAliasName(normalizedKeyword)
                .map(IngredientAlias::getIngredient)
                .map(ingredient -> ingredient.getIngredientName())
                .ifPresent(ingredientNames::add);

        if (ingredientNames.size() < 10 && normalizedKeyword.length() >= 2) {
            ingredientRepository.findAll().stream()
                    .map(IngredientSearchCandidate::from)
                    .filter(candidate -> candidate.normalizedName().length() >= 2)
                    .filter(candidate -> normalizedKeyword.contains(candidate.normalizedName()))
                    .sorted(Comparator
                            .comparingInt((IngredientSearchCandidate candidate) -> candidate.normalizedName().length())
                            .thenComparing(IngredientSearchCandidate::name))
                    .map(IngredientSearchCandidate::name)
                    .forEach(ingredientNames::add);
        }

        return new IngredientSearchResponse(ingredientNames.stream().limit(10).toList());
    }

    @Transactional(readOnly = true)
    public IngredientSearchResponse listIngredientsByCategory(String category) {
        if (!StringUtils.hasText(category)) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        List<String> ingredientNames = ingredientRepository.findByCategoryOrderByIngredientNameAsc(category.trim())
                .stream()
                .map(ingredient -> ingredient.getIngredientName())
                .toList();
        return new IngredientSearchResponse(ingredientNames);
    }

    private String normalizeForSearch(String value) {
        return value == null ? "" : value.replaceAll("[^0-9A-Za-z가-힣]", "").toLowerCase();
    }

    private record IngredientSearchCandidate(String name, String normalizedName) {
        static IngredientSearchCandidate from(com.team200.graduation_project.domain.ingredient.entity.Ingredient ingredient) {
            String name = ingredient.getIngredientName();
            String normalizedName = name == null ? "" : name.replaceAll("[^0-9A-Za-z가-힣]", "").toLowerCase();
            return new IngredientSearchCandidate(name, normalizedName);
        }
    }
}
