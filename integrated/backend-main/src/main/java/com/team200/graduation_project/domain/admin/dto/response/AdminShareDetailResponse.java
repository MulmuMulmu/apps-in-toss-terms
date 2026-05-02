package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShareDetailResponse {
    private String image;
    private String sellerName;
    private String sellerUserId;
    private String sellerTossUserKey;
    private String sellerLoginProvider;
    private String title;
    private String category;
    private String description;
    private String ingredient;
    private LocalDateTime createTime;
}
