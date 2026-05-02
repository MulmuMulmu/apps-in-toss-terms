package com.team200.graduation_project.domain.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team200.graduation_project.domain.ai.dto.OcrAnalyzeResponse;
import com.team200.graduation_project.domain.ai.dto.RecommendationData;
import com.team200.graduation_project.domain.ai.dto.RecommendationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AiClientTest {

    private final RestTemplate restTemplate = new RestTemplate();
    private final MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);
    private final AiClient aiClient = new AiClient(
            restTemplate,
            new ObjectMapper(),
            "http://localhost:8000",
            "http://localhost:8002",
            ""
    );

    @Test
    void analyzeReceiptMapsOcrEnvelopeData() {
        server.expect(requestTo("http://localhost:8000/ai/ocr/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {
                          "success": true,
                          "data": {
                            "purchased_at": "2026-03-11",
                            "food_items": [
                              {"product_name": "우유", "category": "유제품", "quantity": 1}
                            ]
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        OcrAnalyzeResponse response = aiClient.analyzeReceipt(
                new MockMultipartFile("image", "receipt.jpg", "image/jpeg", new byte[]{1, 2, 3})
        );

        assertThat(response.purchased_at()).isEqualTo("2026-03-11");
        assertThat(response.food_items()).hasSize(1);
        assertThat(response.food_items().get(0).product_name()).isEqualTo("우유");
        assertThat(response.food_items().get(0).quantity()).isEqualTo(1);
    }

    @Test
    void recommendRecipesMapsRecommendationEnvelopeData() {
        server.expect(requestTo("http://localhost:8002/ai/ingredient/recommondation"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("""
                        {
                          "userIngredient": {
                            "ingredients": ["김치"],
                            "preferIngredients": ["고등어"],
                            "dispreferIngredients": ["오이"],
                            "IngredientRatio": 0.5
                          },
                          "candidates": [
                            {
                              "recipe_id": "exampleUUID1",
                              "title": "돼지고기 김치찌개",
                              "ingredients": ["김치", "두부"]
                            }
                          ]
                        }
                        """))
                .andRespond(withSuccess("""
                        {
                          "success": true,
                          "data": {
                            "recommendations": [
                              {
                                "recipeId": "exampleUUID1",
                                "title": "돼지고기 김치찌개",
                                "score": 0.92,
                                "match_details": {
                                  "matched": ["김치"],
                                  "missing": ["두부"]
                                }
                              }
                            ]
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        RecommendationRequest request = new RecommendationRequest(
                new RecommendationRequest.UserIngredient(
                        List.of("김치"),
                        List.of("고등어"),
                        List.of("오이"),
                        0.5
                ),
                List.of(new RecommendationRequest.Candidate(
                        "exampleUUID1",
                        "돼지고기 김치찌개",
                        List.of("김치", "두부")
                ))
        );

        RecommendationData response = aiClient.recommendRecipes(request);

        assertThat(response.recommendations()).hasSize(1);
        assertThat(response.recommendations().get(0).recipeId()).isEqualTo("exampleUUID1");
        assertThat(response.recommendations().get(0).match_details().matched()).containsExactly("김치");
    }

    @Test
    void aiServerErrorIsConvertedToAiClientException() {
        server.expect(requestTo("http://localhost:8000/ai/ocr/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        assertThatThrownBy(() -> aiClient.analyzeReceipt(
                new MockMultipartFile("image", "receipt.jpg", "image/jpeg", new byte[]{1})
        )).isInstanceOf(AiClientException.class);
    }

    @Test
    void internalTokenIsSentWhenConfigured() {
        AiClient tokenClient = new AiClient(
                restTemplate,
                new ObjectMapper(),
                "http://localhost:8000",
                "http://localhost:8002",
                "test-internal-token"
        );

        server.expect(requestTo("http://localhost:8002/ai/ingredient/recommondation"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-internal-token"))
                .andExpect(header("X-AI-Internal-Token", "test-internal-token"))
                .andRespond(withSuccess("""
                        {
                          "success": true,
                          "data": {
                            "recommendations": []
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        tokenClient.recommendRecipes(new RecommendationRequest(
                new RecommendationRequest.UserIngredient(List.of("김치"), List.of(), List.of(), 0.5),
                List.of()
        ));
    }
}
