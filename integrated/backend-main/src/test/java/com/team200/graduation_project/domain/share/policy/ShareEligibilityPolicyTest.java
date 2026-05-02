package com.team200.graduation_project.domain.share.policy;

import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ShareEligibilityPolicyTest {

    private final ShareEligibilityPolicy policy = new ShareEligibilityPolicy();

    @Test
    void allowsUnexpiredProduce() {
        UserIngredient onion = userIngredient("양파", "채소/과일", LocalDate.now().plusDays(3));

        assertThat(policy.canShare(onion, "채소/과일", "양파 나눔", "미개봉 원물입니다.")).isTrue();
    }

    @Test
    void blocksExpiredIngredient() {
        UserIngredient onion = userIngredient("양파", "채소/과일", LocalDate.now().minusDays(1));

        assertThat(policy.violationReason(onion, "채소/과일", "양파 나눔", "상태 좋아요"))
                .contains("소비기한");
    }

    @Test
    void blocksRiskyColdChainCategory() {
        UserIngredient pork = userIngredient("삼겹살", "정육/계란", LocalDate.now().plusDays(1));

        assertThat(policy.canShare(pork, "정육/계란", "삼겹살 나눔", "냉장 보관")).isFalse();
    }

    @Test
    void blocksMedicineAndSupplementKeywords() {
        UserIngredient vitamin = userIngredient("비타민", "가공식품", LocalDate.now().plusMonths(6));

        assertThat(policy.violationReason(vitamin, "가공식품", "영양제 나눔", "미개봉"))
                .contains("주류, 의약품, 건강기능식품");
    }

    private static UserIngredient userIngredient(String name, String category, LocalDate expirationDate) {
        Ingredient ingredient = Ingredient.builder()
                .ingredientName(name)
                .category(category)
                .build();
        return UserIngredient.builder()
                .ingredient(ingredient)
                .expirationDate(expirationDate)
                .build();
    }
}
