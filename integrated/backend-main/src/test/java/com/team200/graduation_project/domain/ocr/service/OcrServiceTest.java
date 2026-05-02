package com.team200.graduation_project.domain.ocr.service;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.team200.graduation_project.domain.ai.client.AiClient;
import com.team200.graduation_project.domain.ai.dto.OcrAnalyzeResponse;
import com.team200.graduation_project.domain.ocr.entity.Ocr;
import com.team200.graduation_project.domain.ocr.entity.OcrIngredient;
import com.team200.graduation_project.domain.ocr.repository.OcrIngredientRepository;
import com.team200.graduation_project.domain.ocr.repository.OcrRepository;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

    @Mock
    private AiClient aiClient;

    @Mock
    private OcrRepository ocrRepository;

    @Mock
    private OcrIngredientRepository ocrIngredientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private Storage storage;

    @InjectMocks
    private OcrService ocrService;

    @BeforeEach
    void setUp() throws Exception {
        Field bucketName = OcrService.class.getDeclaredField("bucketName");
        bucketName.setAccessible(true);
        bucketName.set(ocrService, "test-bucket");
    }

    @Test
    void analyzeAndSavePersistsReceiptImageAndRecognizedItemsForAdminReview() {
        User user = User.builder()
                .userId("user-1")
                .nickName("tester")
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        OcrAnalyzeResponse aiResponse = new OcrAnalyzeResponse(
                "2026-03-11",
                List.of(
                        new OcrAnalyzeResponse.FoodItem("우유", "유제품", 2),
                        new OcrAnalyzeResponse.FoodItem("양파", "채소/과일", null)
                )
        );
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{1, 2, 3}
        );

        when(jwtTokenProvider.validateToken("access-token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("access-token")).thenReturn("user-1");
        when(userRepository.findByUserIdIsAndDeletedAtIsNull("user-1")).thenReturn(Optional.of(user));
        when(aiClient.analyzeReceipt(image)).thenReturn(aiResponse);
        when(ocrRepository.save(any(Ocr.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OcrAnalyzeResponse result = ocrService.analyzeAndSave("Bearer access-token", image);

        assertThat(result).isSameAs(aiResponse);
        ArgumentCaptor<Ocr> ocrCaptor = ArgumentCaptor.forClass(Ocr.class);
        verify(ocrRepository).save(ocrCaptor.capture());
        assertThat(ocrCaptor.getValue().getUser()).isEqualTo(user);
        assertThat(ocrCaptor.getValue().getImageUrl()).startsWith("https://storage.googleapis.com/test-bucket/ocr/user-1/");
        assertThat(ocrCaptor.getValue().getPurchaseTime()).isEqualTo(LocalDateTime.of(2026, 3, 11, 0, 0));

        ArgumentCaptor<List<OcrIngredient>> ingredientCaptor = ArgumentCaptor.forClass(List.class);
        verify(ocrIngredientRepository).saveAll(ingredientCaptor.capture());
        assertThat(ingredientCaptor.getValue())
                .extracting(OcrIngredient::getOcrIngredientName)
                .containsExactly("우유", "양파");
        assertThat(ingredientCaptor.getValue())
                .extracting(OcrIngredient::getQuantity)
                .containsExactly(2, 1);
        verify(storage).create(any(BlobInfo.class), any(byte[].class));
    }

    @Test
    void analyzeAndSaveRejectsMissingAuthorizationBeforeCallingAi() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{1}
        );

        assertThatThrownBy(() -> ocrService.analyzeAndSave(null, image))
                .isInstanceOf(GeneralException.class);

        verify(aiClient, never()).analyzeReceipt(any());
        verify(ocrRepository, never()).save(any());
    }
}
