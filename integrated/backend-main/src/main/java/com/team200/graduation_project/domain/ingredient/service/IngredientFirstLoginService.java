package com.team200.graduation_project.domain.ingredient.service;

import com.team200.graduation_project.domain.ingredient.dto.request.ExtraInfoRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.AllergyUpdateRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.PreferUpdateRequest;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserPreference;
import com.team200.graduation_project.domain.user.repository.UserPreferenceRepository;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class IngredientFirstLoginService {

    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public String saveExtraInfo(String authorizationHeader, ExtraInfoRequest request) {
        if (request == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        User user = findUserFromAuthorizationHeader(authorizationHeader);

        userPreferenceRepository.deleteByUser(user);

        List<UserPreference> preferences = new ArrayList<>();
        preferences.addAll(toUserPreferences(user, request.getAllergies(), "ALLERGY"));
        preferences.addAll(toUserPreferences(user, request.getPreferIngredients(), "PREFER"));
        preferences.addAll(toUserPreferences(user, request.getDispreferIngredients(), "DISPREFER"));

        userPreferenceRepository.saveAll(preferences);
        user.updateFirstLogin(false);

        return "성공적으로 저장되었습니다.";
    }

    @Transactional
    public String updateAllergy(String authorizationHeader, AllergyUpdateRequest request) {
        if (request == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            userPreferenceRepository.deleteByUserAndType(user, "ALLERGY");

            List<UserPreference> allergies = toUserPreferences(user, request.getNewAllergy(), "ALLERGY");
            if (!allergies.isEmpty()) {
                userPreferenceRepository.saveAll(Objects.requireNonNull(allergies));
            }

            return "알러지 목록이 성공적으로 수정되었습니다.";
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.ALLERGY_UPDATE_FAILED);
        }
    }

    @Transactional
    public String updatePrefer(String authorizationHeader, PreferUpdateRequest request) {
        if (request == null || !StringUtils.hasText(request.getType())) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            String preferenceType = toPreferenceType(request.getType());

            userPreferenceRepository.deleteByUserAndType(user, preferenceType);
            List<UserPreference> preferences = toUserPreferences(user, request.getNewPrefer(), preferenceType);
            if (!preferences.isEmpty()) {
                userPreferenceRepository.saveAll(Objects.requireNonNull(preferences));
            }

            return "선호/비선호 목록이 성공적으로 수정되었습니다.";
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.PREFER_UPDATE_FAILED);
        }
    }

    private User findUserFromAuthorizationHeader(String authorizationHeader) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String userId = jwtTokenProvider.getSubject(token);
        return userRepository.findByUserIdIs(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.UNAUTHORIZED));
    }

    private String extractAccessToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String bearerPrefix = "Bearer ";
        if (authorizationHeader.startsWith(bearerPrefix)) {
            return authorizationHeader.substring(bearerPrefix.length()).trim();
        }

        return authorizationHeader.trim();
    }

    private List<UserPreference> toUserPreferences(User user, List<String> ingredientNames, String type) {
        if (ingredientNames == null || ingredientNames.isEmpty()) {
            return List.of();
        }

        return ingredientNames.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .map(name -> createUserPreference(user, name, type))
                .toList();
    }

    private String toPreferenceType(String type) {
        String normalizedType = type.trim();
        if ("선호".equals(normalizedType) || "PREFER".equalsIgnoreCase(normalizedType)) {
            return "PREFER";
        }
        if ("비선호".equals(normalizedType) || "DISPREFER".equalsIgnoreCase(normalizedType)) {
            return "DISPREFER";
        }
        throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
    }

    private UserPreference createUserPreference(User user, String ingredientName, String type) {
        Ingredient ingredient = ingredientRepository.findByIngredientName(ingredientName)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.BAD_REQUEST));

        return UserPreference.builder()
                .user(user)
                .ingredient(ingredient)
                .type(type)
                .build();
    }
}

