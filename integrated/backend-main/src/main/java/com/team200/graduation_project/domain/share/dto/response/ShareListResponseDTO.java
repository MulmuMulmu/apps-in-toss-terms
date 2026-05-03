package com.team200.graduation_project.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareListResponseDTO {

    private List<ShareItemDTO> items;
    private Long totalCount;
    private Integer page;
    private Integer size;
    private Boolean hasNext;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShareItemDTO {
        private UUID postId;
        private String sellerId;
        private String sellerName;
        private String sellerProfileImageUrl;
        private String title;
        private String ingredientName;
        private String category;
        private LocalDate expirationDate;
        private String locationName;
        private Double distance;
        private Double latitude;
        private Double longitude;
        private String image;
        private LocalDateTime createdAt;
    }
}
