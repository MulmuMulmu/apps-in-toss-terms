package com.team200.graduation_project.domain.share.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShareRequestDTO {
    @Schema(description = "나눔 물품 사진")
    private MultipartFile image;

    @Schema(description = "연결할 사용자의 식재료 이름", example = "양배추")
    private String ingredientName;

    @Schema(description = "나눔글 제목", example = "양배추 가져가세요")
    private String title;

    @Schema(description = "나눔글 내용", example = "상태 아주 좋아요")
    private String content;

    @Schema(description = "나눔 물품 카테고리", example = "채소")
    private String category;

    @Schema(description = "소비기한", example = "2026-04-20")
    private LocalDate expirationDate;
}
