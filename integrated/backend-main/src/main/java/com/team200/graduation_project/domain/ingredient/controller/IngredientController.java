package com.team200.graduation_project.domain.ingredient.controller;

import com.team200.graduation_project.domain.ingredient.dto.request.AllergyUpdateRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.PreferUpdateRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientDeleteRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientUpdateRequest;
import com.team200.graduation_project.domain.ai.client.AiClientException;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionRequest;
import com.team200.graduation_project.domain.ingredient.service.IngredientService;
import com.team200.graduation_project.domain.ingredient.dto.request.ExtraInfoRequest;
import com.team200.graduation_project.domain.ingredient.service.IngredientExpiryPredictionService;
import com.team200.graduation_project.domain.ingredient.service.IngredientFirstLoginService;
import com.team200.graduation_project.domain.ingredient.service.UserIngredientService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientExpirationResponse;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientPageResponse;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientSearchResponse;

@RestController
@RequestMapping("/ingredient")
@RequiredArgsConstructor
public class IngredientController implements IngredientControllerDocs {

    private final IngredientService ingredientService;
    private final IngredientFirstLoginService ingredientFirstLoginService;
    private final UserIngredientService userIngredientService;
    private final IngredientExpiryPredictionService ingredientExpiryPredictionService;

    @GetMapping("/search")
    @Override
    public ApiResponse<?> searchIngredients(@RequestParam String keyword) {
        return ApiResponse.onSuccess(ingredientService.searchIngredients(keyword));
    }

    @GetMapping("/category")
    @Override
    public ApiResponse<?> listIngredientsByCategory(@RequestParam String category) {
        return ApiResponse.onSuccess(ingredientService.listIngredientsByCategory(category));
    }

    @PostMapping("/input")
    @Override
    public ApiResponse<String> inputIngredients(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody java.util.List<UserIngredientInputRequest> request) {
        return ApiResponse.onSuccess(userIngredientService.saveUserIngredients(authorizationHeader, request));
    }

    @PostMapping("/prediction")
    public ApiResponse<?> predictIngredientExpiration(@RequestBody ExpiryPredictionRequest request) {
        try {
            return ApiResponse.onSuccess(ingredientExpiryPredictionService.predict(request));
        } catch (AiClientException e) {
            return ApiResponse.onFailure("AI500", "소비기한을 예측할 수 없습니다.");
        }
    }

    @GetMapping("/all/my")
    @Override
    public ApiResponse<List<UserIngredientSearchResponse>> searchMyIngredients(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @ModelAttribute com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest request) {
        return ApiResponse.onSuccess(userIngredientService.searchUserIngredients(authorizationHeader, request));
    }

    @GetMapping("/all/my/page")
    public ApiResponse<UserIngredientPageResponse> searchMyIngredientsPage(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @ModelAttribute com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.onSuccess(userIngredientService.searchUserIngredientsPage(authorizationHeader, request, page, size));
    }

    @DeleteMapping("/all/my")
    public ApiResponse<String> deleteMyIngredients(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody UserIngredientDeleteRequest request) {
        return ApiResponse.onSuccess(userIngredientService.deleteUserIngredients(authorizationHeader, request.getIngredientIds()));
    }

    @PutMapping("/all/my/{userIngredientId}")
    public ApiResponse<String> updateMyIngredient(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID userIngredientId,
            @RequestBody UserIngredientUpdateRequest request) {
        return ApiResponse.onSuccess(userIngredientService.updateUserIngredient(authorizationHeader, userIngredientId, request));
    }

    @GetMapping("/experationDate/3")
    @Override
    public ApiResponse<Integer> countExpiringIngredients(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return ApiResponse.onSuccess(userIngredientService.countExpiringIngredients(authorizationHeader, 3));
    }

    @GetMapping("/expiration/near")
    @Override
    public ApiResponse<List<UserIngredientExpirationResponse>> getNearExpiringIngredients(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return ApiResponse.onSuccess(userIngredientService.getNearExpiringIngredients(authorizationHeader));
    }

    @PostMapping("/first/login")
    @Override
    public ApiResponse<String> saveExtraInfo(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody ExtraInfoRequest request
    ) {
        return ApiResponse.onSuccess(ingredientFirstLoginService.saveExtraInfo(authorizationHeader, request));
    }

    @GetMapping("/preferences")
    public ApiResponse<?> getPreferenceSettings(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return ApiResponse.onSuccess(ingredientFirstLoginService.getPreferenceSettings(authorizationHeader));
    }

    @PutMapping("/allergy")
    @Override
    public ApiResponse<String> updateAllergy(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody AllergyUpdateRequest request
    ) {
        return ApiResponse.onSuccess(ingredientFirstLoginService.updateAllergy(authorizationHeader, request));
    }

    @PutMapping("/prefer")
    @Override
    public ApiResponse<String> updatePrefer(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody PreferUpdateRequest request
    ) {
        return ApiResponse.onSuccess(ingredientFirstLoginService.updatePrefer(authorizationHeader, request));
    }
}
