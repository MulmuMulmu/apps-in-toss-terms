package com.team200.graduation_project.domain.ingredient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.domain.ingredient.repository.UserIngredientRepository;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserIngredientServiceTest {

    @Mock
    private UserIngredientRepository userIngredientRepository;
    @Mock
    private IngredientRepository ingredientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private IngredientExpiryPredictionService ingredientExpiryPredictionService;

    @InjectMocks
    private UserIngredientService userIngredientService;

    @Test
    void saveUserIngredientsDoesNotCreateDuplicateIngredientForSameUser() {
        User user = User.builder()
                .userId("toss_111")
                .nickName("사용자")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        Ingredient milk = Ingredient.builder()
                .ingredientName("우유")
                .category("유제품")
                .build();
        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn("toss_111");
        when(userRepository.findByUserIdIs("toss_111")).thenReturn(Optional.of(user));
        when(ingredientRepository.findByIngredientName("우유")).thenReturn(Optional.of(milk));
        when(userIngredientRepository.existsByUserAndIngredient(user, milk)).thenReturn(true);

        String result = userIngredientService.saveUserIngredients(
                "Bearer token",
                List.of(new UserIngredientInputRequest(
                        "우유",
                        LocalDate.of(2026, 5, 1),
                        LocalDate.of(2026, 5, 8),
                        "유제품"
                ))
        );

        assertThat(result).isEqualTo("이미 등록된 식재료입니다.");
        verify(userIngredientRepository, never()).saveAll(anyList());
        verify(ingredientExpiryPredictionService, never()).predict(org.mockito.ArgumentMatchers.any());
    }
}
