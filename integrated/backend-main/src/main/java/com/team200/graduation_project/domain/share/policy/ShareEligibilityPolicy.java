package com.team200.graduation_project.domain.share.policy;

import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class ShareEligibilityPolicy {

    private static final Set<String> BLOCKED_CATEGORIES = Set.of(
            "정육/계란",
            "해산물",
            "유제품",
            "건강기능식품",
            "의약품",
            "주류"
    );

    private static final List<String> BLOCKED_KEYWORDS = List.of(
            "술", "맥주", "소주", "와인", "막걸리", "담배", "전자담배",
            "약", "의약품", "감기약", "진통제", "연고", "한약",
            "건강기능식품", "건기식", "영양제", "비타민", "홍삼",
            "분유", "이유식", "해외직구", "직구",
            "개봉한", "개봉됨", "뜯은", "소분", "조리", "반찬", "수제"
    );

    public boolean canShare(UserIngredient userIngredient, String requestedCategory, String title, String content) {
        return violationReason(userIngredient, requestedCategory, title, content) == null;
    }

    public String violationReason(UserIngredient userIngredient, String requestedCategory, String title, String content) {
        if (userIngredient == null || userIngredient.getIngredient() == null) {
            return "나눔할 식재료를 확인할 수 없습니다.";
        }

        LocalDate expirationDate = userIngredient.getExpirationDate();
        if (expirationDate != null && expirationDate.isBefore(LocalDate.now())) {
            return "소비기한이 지난 식재료는 나눔할 수 없습니다.";
        }

        String ingredientName = userIngredient.getIngredient().getIngredientName();
        String ingredientCategory = userIngredient.getIngredient().getCategory();
        if (isBlockedCategory(ingredientCategory) || isBlockedCategory(requestedCategory)) {
            return "냉장/냉동 안전 확인이 어려운 정육, 계란, 해산물, 유제품 및 건강기능식품은 나눔할 수 없습니다.";
        }

        String joinedText = String.join(" ",
                nullToEmpty(ingredientName),
                nullToEmpty(ingredientCategory),
                nullToEmpty(requestedCategory),
                nullToEmpty(title),
                nullToEmpty(content)
        ).toLowerCase(Locale.ROOT);

        boolean hasBlockedKeyword = BLOCKED_KEYWORDS.stream()
                .map(keyword -> keyword.toLowerCase(Locale.ROOT))
                .anyMatch(joinedText::contains);
        if (hasBlockedKeyword) {
            return "주류, 의약품, 건강기능식품, 개봉/소분/조리 식품은 나눔할 수 없습니다.";
        }

        return null;
    }

    private static boolean isBlockedCategory(String category) {
        if (!StringUtils.hasText(category)) {
            return false;
        }
        return BLOCKED_CATEGORIES.stream().anyMatch(category::contains);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
