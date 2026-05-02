package com.team200.graduation_project.domain.ocr.controller;

import com.team200.graduation_project.domain.ai.client.AiClientException;
import com.team200.graduation_project.domain.ai.dto.OcrAnalyzeResponse;
import com.team200.graduation_project.domain.ocr.service.OcrService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OcrController.class)
@AutoConfigureMockMvc(addFilters = false)
class OcrControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OcrService ocrService;

    @Test
    void analyzeReceiptWrapsAiResultWithBackendEnvelope() throws Exception {
        Mockito.when(ocrService.analyzeAndSave(any(), any())).thenReturn(new OcrAnalyzeResponse(
                "2026-03-11",
                List.of(new OcrAnalyzeResponse.FoodItem("우유", "유제품", 1))
        ));

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/ingredient/analyze").file(image))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result.purchased_at").value("2026-03-11"))
                .andExpect(jsonPath("$.result.food_items[0].product_name").value("우유"))
                .andExpect(jsonPath("$.result.food_items[0].quantity").value(1));
    }

    @Test
    void analyzeReceiptWrapsAiFailureWithBackendEnvelope() throws Exception {
        Mockito.when(ocrService.analyzeAndSave(any(), any())).thenThrow(new AiClientException("downstream failed"));

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{1}
        );

        mockMvc.perform(multipart("/ingredient/analyze").file(image))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AI500"));
    }
}
