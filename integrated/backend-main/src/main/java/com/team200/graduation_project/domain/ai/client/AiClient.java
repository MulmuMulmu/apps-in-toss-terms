package com.team200.graduation_project.domain.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionRequest;
import com.team200.graduation_project.domain.ai.dto.ExpiryPredictionResult;
import com.team200.graduation_project.domain.ai.dto.OcrAnalyzeResponse;
import com.team200.graduation_project.domain.ai.dto.RecommendationData;
import com.team200.graduation_project.domain.ai.dto.RecommendationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Component
public class AiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String ocrBaseUrl;
    private final String recommendBaseUrl;
    private final String internalToken;

    public AiClient(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${ai.ocr.base-url}") String ocrBaseUrl,
            @Value("${ai.recommend.base-url}") String recommendBaseUrl,
            @Value("${ai.internal-token:}") String internalToken
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.ocrBaseUrl = trimTrailingSlash(ocrBaseUrl);
        this.recommendBaseUrl = trimTrailingSlash(recommendBaseUrl);
        this.internalToken = internalToken == null ? "" : internalToken.trim();
    }

    public OcrAnalyzeResponse analyzeReceipt(MultipartFile image) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            applyInternalToken(headers);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new MultipartImageResource(image));

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    ocrBaseUrl + "/ai/ocr/analyze?debug=true",
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );

            return readAiData(response.getBody(), OcrAnalyzeResponse.class);
        } catch (IOException | RestClientException e) {
            throw new AiClientException("AI OCR service request failed.", e);
        }
    }

    public RecommendationData recommendRecipes(RecommendationRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            applyInternalToken(headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    recommendBaseUrl + "/ai/ingredient/recommondation",
                    new HttpEntity<>(request, headers),
                    JsonNode.class
            );

            return readAiData(response.getBody(), RecommendationData.class);
        } catch (RestClientException e) {
            throw new AiClientException("AI recommendation service request failed.", e);
        }
    }

    public ExpiryPredictionResult predictExpiry(ExpiryPredictionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            applyInternalToken(headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    ocrBaseUrl + "/ai/ingredient/prediction",
                    new HttpEntity<>(request, headers),
                    JsonNode.class
            );

            return readAiResult(response.getBody(), ExpiryPredictionResult.class);
        } catch (RestClientException e) {
            throw new AiClientException("AI expiry prediction service request failed.", e);
        }
    }

    private <T> T readAiData(JsonNode body, Class<T> targetType) {
        if (body == null || !body.path("success").asBoolean(false) || body.get("data") == null) {
            throw new AiClientException("AI service returned an unsuccessful envelope.");
        }

        return objectMapper.convertValue(body.get("data"), targetType);
    }

    private <T> T readAiResult(JsonNode body, Class<T> targetType) {
        if (body == null || !body.path("success").asBoolean(false) || body.get("result") == null) {
            throw new AiClientException("AI service returned an unsuccessful envelope.");
        }

        return objectMapper.convertValue(body.get("result"), targetType);
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private void applyInternalToken(HttpHeaders headers) {
        if (!internalToken.isBlank()) {
            headers.setBearerAuth(internalToken);
            headers.set("X-AI-Internal-Token", internalToken);
        }
    }

    private static class MultipartImageResource extends ByteArrayResource {

        private final String filename;

        MultipartImageResource(MultipartFile image) throws IOException {
            super(image.getBytes());
            this.filename = image.getOriginalFilename() == null ? "receipt-image" : image.getOriginalFilename();
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
