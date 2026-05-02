package com.team200.graduation_project.domain.ocr.service;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.team200.graduation_project.domain.ai.client.AiClient;
import com.team200.graduation_project.domain.ai.dto.OcrAnalyzeResponse;
import com.team200.graduation_project.domain.ocr.entity.Ocr;
import com.team200.graduation_project.domain.ocr.entity.OcrIngredient;
import com.team200.graduation_project.domain.ocr.repository.OcrIngredientRepository;
import com.team200.graduation_project.domain.ocr.repository.OcrRepository;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class OcrService {

    private final AiClient aiClient;
    private final OcrRepository ocrRepository;
    private final OcrIngredientRepository ocrIngredientRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final Storage storage;

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    @Transactional
    public OcrAnalyzeResponse analyzeAndSave(String authorizationHeader, MultipartFile image) {
        User user = findUserFromAuthorizationHeader(authorizationHeader);
        OcrAnalyzeResponse response = aiClient.analyzeReceipt(image);

        try {
            String imageUrl = uploadReceiptImage(image, user.getUserId());
            Ocr ocr = Ocr.builder()
                    .user(user)
                    .imageUrl(imageUrl)
                    .purchaseTime(parsePurchaseTime(response.purchased_at()))
                    .createTime(LocalDateTime.now())
                    .accuracy(null)
                    .build();
            Ocr savedOcr = ocrRepository.save(ocr);

            List<OcrAnalyzeResponse.FoodItem> foodItems = response.food_items();
            if (foodItems != null && !foodItems.isEmpty()) {
                List<OcrIngredient> ocrIngredients = foodItems.stream()
                        .filter(item -> item != null && StringUtils.hasText(item.product_name()))
                        .map(item -> OcrIngredient.builder()
                                .ocr(savedOcr)
                                .ocrIngredientName(item.product_name())
                                .originalOcrIngredientName(resolveOriginalName(item))
                                .normalizedIngredientName(resolveNormalizedName(item))
                                .category(item.category())
                                .quantity(item.quantity() == null ? 1 : item.quantity())
                                .build())
                        .toList();
                ocrIngredientRepository.saveAll(ocrIngredients);
            }

            return response;
        } catch (IOException e) {
            throw new GeneralException(GeneralErrorCode.INGREDIENT_SAVE_FAILED);
        }
    }

    private User findUserFromAuthorizationHeader(String authorizationHeader) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String userId = jwtTokenProvider.getSubject(token);
        return userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
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

    private String uploadReceiptImage(MultipartFile image, String userId) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String date = LocalDate.now().toString();
        String originalFilename = StringUtils.hasText(image.getOriginalFilename())
                ? image.getOriginalFilename()
                : "receipt-image";
        String fileName = String.format("ocr/%s/%s/%s_%s", userId, date, uuid, originalFilename);

        if ("local-bucket".equals(bucketName)) {
            Path uploadPath = Paths.get("build", "local-uploads", fileName);
            Files.createDirectories(uploadPath.getParent());
            Files.write(uploadPath, image.getBytes());
            return "http://localhost:8080/local-uploads/" + fileName;
        }

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(image.getContentType())
                .build();
        storage.create(blobInfo, image.getBytes());

        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }

    private LocalDateTime parsePurchaseTime(String purchasedAt) {
        if (!StringUtils.hasText(purchasedAt)) {
            return LocalDateTime.now();
        }

        try {
            return LocalDate.parse(purchasedAt).atStartOfDay();
        } catch (RuntimeException e) {
            return LocalDateTime.now();
        }
    }

    private String resolveOriginalName(OcrAnalyzeResponse.FoodItem item) {
        return StringUtils.hasText(item.raw_product_name()) ? item.raw_product_name() : item.product_name();
    }

    private String resolveNormalizedName(OcrAnalyzeResponse.FoodItem item) {
        if (StringUtils.hasText(item.normalized_name())) {
            return item.normalized_name();
        }
        if (StringUtils.hasText(item.ingredientName())) {
            return item.ingredientName();
        }
        return item.product_name();
    }
}
