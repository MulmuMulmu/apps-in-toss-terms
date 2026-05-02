package com.team200.graduation_project.domain.share.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShareSuccessionRequestDTO {
    @Schema(description = "나눔 게시글 ID", example = "aed70029-7b9e-4504-8ecd-5f09491cdbe7")
    private UUID postId;

    @Schema(description = "식재료 받는 사람 닉네임", example = "홍길동")
    private String takerNickName;

    @Schema(description = "나눔 유형. 현재는 전체 나눔만 지원", example = "전체")
    private String type;
}
