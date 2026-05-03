package com.team200.graduation_project.domain.ingredient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientUpdateRequest;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientPageResponse;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientSource;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredientStatus;
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
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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

    @Test
    void updateUserIngredientChangesOnlyOwnedIngredient() {
        User user = User.builder()
                .userId("toss_111")
                .nickName("사용자")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        Ingredient egg = Ingredient.builder()
                .ingredientName("계란")
                .category("정육/계란")
                .build();
        Ingredient onion = Ingredient.builder()
                .ingredientName("양파")
                .category("채소/과일")
                .build();
        UUID userIngredientId = UUID.randomUUID();
        UserIngredient userIngredient = UserIngredient.builder()
                .userIngredientId(userIngredientId)
                .user(user)
                .ingredient(egg)
                .purchaseDate(LocalDate.of(2026, 5, 1))
                .expirationDate(LocalDate.of(2026, 5, 5))
                .status(UserIngredientStatus.UNUSED)
                .source(IngredientSource.MANUAL)
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn("toss_111");
        when(userRepository.findByUserIdIs("toss_111")).thenReturn(Optional.of(user));
        when(userIngredientRepository.findById(userIngredientId)).thenReturn(Optional.of(userIngredient));
        when(ingredientRepository.findByIngredientName("양파")).thenReturn(Optional.of(onion));

        String result = userIngredientService.updateUserIngredient(
                "Bearer token",
                userIngredientId,
                new UserIngredientUpdateRequest(
                        "양파",
                        LocalDate.of(2026, 5, 2),
                        LocalDate.of(2026, 5, 9),
                        "사용 중"
                )
        );

        assertThat(result).isEqualTo("식재료가 수정되었습니다.");
        assertThat(userIngredient.getIngredient()).isSameAs(onion);
        assertThat(userIngredient.getPurchaseDate()).isEqualTo(LocalDate.of(2026, 5, 2));
        assertThat(userIngredient.getExpirationDate()).isEqualTo(LocalDate.of(2026, 5, 9));
        assertThat(userIngredient.getStatus()).isEqualTo(UserIngredientStatus.IN_USE);
    }

    @Test
    void searchUserIngredientsPageUsesRepositoryPagingWithKeywordAndCategory() {
        User user = User.builder()
                .userId("toss_111")
                .nickName("사용자")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        Ingredient kimchi = Ingredient.builder()
                .ingredientName("김치")
                .category("가공식품")
                .build();
        UserIngredient userIngredient = UserIngredient.builder()
                .userIngredientId(UUID.randomUUID())
                .user(user)
                .ingredient(kimchi)
                .purchaseDate(LocalDate.of(2026, 5, 1))
                .expirationDate(LocalDate.of(2026, 5, 10))
                .status(UserIngredientStatus.UNUSED)
                .source(IngredientSource.MANUAL)
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn("toss_111");
        when(userRepository.findByUserIdIs("toss_111")).thenReturn(Optional.of(user));
        when(userIngredientRepository.findByUserAndIngredient_CategoryInAndIngredient_IngredientNameContainingIgnoreCase(
                org.mockito.ArgumentMatchers.eq(user),
                org.mockito.ArgumentMatchers.eq(List.of("가공식품")),
                org.mockito.ArgumentMatchers.eq("김치"),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(userIngredient), org.springframework.data.domain.PageRequest.of(1, 20), 21));

        UserIngredientPageResponse result = userIngredientService.searchUserIngredientsPage(
                "Bearer token",
                new UserIngredientSearchRequest(List.of("가공식품"), "date&ascending", "김치"),
                1,
                20
        );

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getIngredient()).isEqualTo("김치");
        assertThat(result.getItems().get(0).getSortRank()).isEqualTo(21);
        assertThat(result.getTotalCount()).isEqualTo(21);
        assertThat(result.isHasNext()).isFalse();
        verify(userIngredientRepository, never()).findByUser(
                org.mockito.ArgumentMatchers.eq(user),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Sort.class)
        );
    }
}
