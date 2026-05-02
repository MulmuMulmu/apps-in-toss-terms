package com.team200.graduation_project.domain.ocr.controller;

import com.team200.graduation_project.domain.ai.client.AiClientException;
import com.team200.graduation_project.domain.ocr.service.OcrService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ingredient")
public class OcrController implements OcrControllerDocs {

    private final OcrService ocrService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> analyzeReceipt(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestPart("image") MultipartFile image
    ) {
        try {
            return ApiResponse.onSuccess(ocrService.analyzeAndSave(authorizationHeader, image));
        } catch (AiClientException e) {
            return ApiResponse.onFailure("AI500", "영수증을 분석할 수 없습니다.");
        }
    }
}
