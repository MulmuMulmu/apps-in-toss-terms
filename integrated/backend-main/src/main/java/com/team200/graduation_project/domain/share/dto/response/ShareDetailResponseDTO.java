package com.team200.graduation_project.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareDetailResponseDTO {
    private String image;
    private String sellerId;
    private String sellerName;
    private String sellerProfileImageUrl;
    private String title;
    private String ingredientName;
    private String category;
    private String content;
    private LocalDate expirationDate;
    private LocalDateTime createTime;
    private String locationName;
    private Double latitude;
    private Double longitude;
}
