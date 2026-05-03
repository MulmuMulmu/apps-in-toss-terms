package com.team200.graduation_project.domain.ingredient.service;

import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientUpdateRequest;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionRequest;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionResult;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientSource;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredientStatus;
import com.team200.graduation_project.domain.ingredient.exception.IngredientErrorCode;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.domain.ingredient.repository.UserIngredientRepository;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientExpirationResponse;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientPageResponse;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientSearchResponse;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class UserIngredientService {

    private final UserIngredientRepository userIngredientRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final IngredientExpiryPredictionService ingredientExpiryPredictionService;

    @Transactional
    public String saveUserIngredients(String authorizationHeader, List<UserIngredientInputRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);

            Set<String> requestedNames = new HashSet<>();
            List<UserIngredient> userIngredients = requests.stream().map(request -> {
                Ingredient ingredient = ingredientRepository.findByIngredientName(request.getIngredient())
                        .orElseThrow(() -> new GeneralException(GeneralErrorCode.INGREDIENT_NOT_FOUNDED));
                if (!requestedNames.add(ingredient.getIngredientName())
                        || userIngredientRepository.existsByUserAndIngredient(user, ingredient)) {
                    return null;
                }

                return UserIngredient.builder()
                        .user(user)
                        .ingredient(ingredient)
                        .purchaseDate(request.getPurchaseDate())
                        .expirationDate(resolveExpirationDate(request, ingredient))
                        .status(UserIngredientStatus.NORMAL)
                        .source(IngredientSource.MANUAL)
                        .build();
            }).filter(java.util.Objects::nonNull).collect(Collectors.toList());

            if (userIngredients.isEmpty()) {
                return "이미 등록된 식재료입니다.";
            }

            userIngredientRepository.saveAll(userIngredients);
            return "성공적으로 저장되었습니다.";
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_SAVE_FAILED);
        }
    }

    private LocalDate resolveExpirationDate(UserIngredientInputRequest request, Ingredient ingredient) {
        if (request.getExpirationDate() != null) {
            return request.getExpirationDate();
        }
        if (request.getPurchaseDate() == null) {
            return null;
        }

        ExpiryPredictionResult prediction = ingredientExpiryPredictionService.predict(new ExpiryPredictionRequest(
                request.getPurchaseDate().toString(),
                List.of(ingredient.getIngredientName())
        ));

        return prediction.ingredients().stream()
                .filter(item -> ingredient.getIngredientName().equals(item.ingredientName()))
                .findFirst()
                .or(() -> prediction.ingredients().stream().findFirst())
                .map(ExpiryPredictionResult.IngredientExpiry::expirationDate)
                .map(LocalDate::parse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientSearchResponse> searchUserIngredients(
            String authorizationHeader,
            com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest request) {
        
        if (request == null || !StringUtils.hasText(request.getSort())) {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            org.springframework.data.domain.Sort sort = createSort(request.getSort());
            
            List<UserIngredient> items;
            if (request.getCategory() != null && !request.getCategory().isEmpty()) {
                items = userIngredientRepository.findByUserAndIngredient_CategoryIn(user, request.getCategory(), sort);
            } else {
                items = userIngredientRepository.findByUser(user, sort);
            }

            String keyword = request.getKeyword() == null ? "" : request.getKeyword().trim().toLowerCase();
            if (StringUtils.hasText(keyword)) {
                items = items.stream()
                        .filter(item -> item.getIngredient() != null
                                && item.getIngredient().getIngredientName() != null
                                && item.getIngredient().getIngredientName().toLowerCase().contains(keyword))
                        .collect(Collectors.toList());
            }

            java.time.LocalDate today = java.time.LocalDate.now();
            List<com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientSearchResponse> responses = new java.util.ArrayList<>();
            
            for (int i = 0; i < items.size(); i++) {
                responses.add(toSearchResponse(items.get(i), i + 1, today));
            }
            return responses;
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_CALCULATION_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public UserIngredientPageResponse searchUserIngredientsPage(
            String authorizationHeader,
            com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest request,
            int page,
            int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }

        if (request == null || !StringUtils.hasText(request.getSort())) {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(page, size, createSort(request.getSort()));
            String keyword = request.getKeyword() == null ? "" : request.getKeyword().trim();
            boolean hasKeyword = StringUtils.hasText(keyword);
            boolean hasCategories = request.getCategory() != null && !request.getCategory().isEmpty();

            org.springframework.data.domain.Page<UserIngredient> ingredientPage;
            if (hasCategories && hasKeyword) {
                ingredientPage = userIngredientRepository.findByUserAndIngredient_CategoryInAndIngredient_IngredientNameContainingIgnoreCase(
                        user, request.getCategory(), keyword, pageRequest);
            } else if (hasCategories) {
                ingredientPage = userIngredientRepository.findByUserAndIngredient_CategoryIn(user, request.getCategory(), pageRequest);
            } else if (hasKeyword) {
                ingredientPage = userIngredientRepository.findByUserAndIngredient_IngredientNameContainingIgnoreCase(user, keyword, pageRequest);
            } else {
                ingredientPage = userIngredientRepository.findByUser(user, pageRequest);
            }

            java.time.LocalDate today = java.time.LocalDate.now();
            int rankOffset = page * size;
            List<UserIngredientSearchResponse> items = new java.util.ArrayList<>();
            for (int i = 0; i < ingredientPage.getContent().size(); i++) {
                items.add(toSearchResponse(ingredientPage.getContent().get(i), rankOffset + i + 1, today));
            }

            return UserIngredientPageResponse.builder()
                    .items(items)
                    .totalCount((int) ingredientPage.getTotalElements())
                    .page(page)
                    .size(size)
                    .hasNext(ingredientPage.hasNext())
                    .build();
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_CALCULATION_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public Integer countExpiringIngredients(String authorizationHeader, int withinDays) {
        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate endDate = today.plusDays(withinDays);

            return userIngredientRepository.countByUserAndExpirationDateBetween(user, today, endDate);
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_COUNT_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public List<UserIngredientExpirationResponse> getNearExpiringIngredients(String authorizationHeader) {
        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            List<UserIngredient> items = userIngredientRepository.findByUser(user, Sort.by(Sort.Direction.ASC, "expirationDate"));

            LocalDate today = LocalDate.now();

            Map<Long, List<String>> grouped = items.stream()
                    .filter(item -> item.getExpirationDate() != null)
                    .collect(Collectors.groupingBy(
                            item -> ChronoUnit.DAYS.between(today, item.getExpirationDate()),
                            Collectors.mapping(
                                    item -> item.getIngredient().getIngredientName(),
                                    Collectors.toList()
                            )
                    ));

            return grouped.entrySet().stream()
                    .map(entry -> UserIngredientExpirationResponse.builder()
                            .dDay(entry.getKey())
                            .ingredient(entry.getValue())
                            .build())
                    .sorted(Comparator.comparingLong(UserIngredientExpirationResponse::getDDay))
                    .collect(Collectors.toList());

        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_NEAR_EXPIRATION_FAILED);
        }
    }

    @Transactional
    public String deleteUserIngredients(String authorizationHeader, List<UUID> ingredientIds) {
        if (ingredientIds == null || ingredientIds.isEmpty()) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        User user = findUserFromAuthorizationHeader(authorizationHeader);
        List<UserIngredient> userIngredients = userIngredientRepository.findAllById(ingredientIds);

        if (userIngredients.size() != new HashSet<>(ingredientIds).size()) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_NOT_FOUNDED);
        }

        boolean hasOtherUserIngredient = userIngredients.stream()
                .anyMatch(item -> !item.getUser().getUserId().equals(user.getUserId()));
        if (hasOtherUserIngredient) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        userIngredientRepository.deleteAll(userIngredients);
        return "선택한 식재료가 삭제되었습니다.";
    }

    @Transactional
    public String updateUserIngredient(String authorizationHeader, UUID userIngredientId, UserIngredientUpdateRequest request) {
        if (userIngredientId == null || request == null || !StringUtils.hasText(request.getIngredient())) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        User user = findUserFromAuthorizationHeader(authorizationHeader);
        UserIngredient userIngredient = userIngredientRepository.findById(userIngredientId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.INGREDIENT_NOT_FOUNDED));
        if (!userIngredient.getUser().getUserId().equals(user.getUserId())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        Ingredient ingredient = ingredientRepository.findByIngredientName(request.getIngredient())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.INGREDIENT_NOT_FOUNDED));
        userIngredient.updateOwnedIngredient(
                ingredient,
                request.getPurchaseDate(),
                request.getExpirationDate(),
                UserIngredientStatus.fromClientValue(request.getStatus())
        );

        return "식재료가 수정되었습니다.";
    }

    private UserIngredientSearchResponse toSearchResponse(UserIngredient item, int sortRank, LocalDate today) {
        long dDay = 0;
        if (item.getExpirationDate() != null) {
            dDay = ChronoUnit.DAYS.between(today, item.getExpirationDate());
        }

        return UserIngredientSearchResponse.builder()
                .userIngredientId(item.getUserIngredientId())
                .sortRank(sortRank)
                .ingredient(item.getIngredient().getIngredientName())
                .category(item.getIngredient().getCategory())
                .status(item.getStatus() == null ? null : item.getStatus().getDescription())
                .dDay(dDay)
                .purchaseDate(item.getPurchaseDate())
                .expirationDate(item.getExpirationDate())
                .build();
    }

    private org.springframework.data.domain.Sort createSort(String sortStr) {
        String[] parts = sortStr.split("&");
        if (parts.length != 2) {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }
        String field = parts[0];
        String order = parts[1];
        
        org.springframework.data.domain.Sort.Direction direction;
        if ("ascending".equalsIgnoreCase(order)) {
            direction = org.springframework.data.domain.Sort.Direction.ASC;
        } else if ("descending".equalsIgnoreCase(order)) {
            direction = org.springframework.data.domain.Sort.Direction.DESC;
        } else {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }
        
        String sortProperty;
        if ("date".equalsIgnoreCase(field)) {
            sortProperty = "expirationDate";
        } else if ("name".equalsIgnoreCase(field)) {
            sortProperty = "ingredient.ingredientName";
        } else {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }
        
        return org.springframework.data.domain.Sort.by(direction, sortProperty);
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
}
