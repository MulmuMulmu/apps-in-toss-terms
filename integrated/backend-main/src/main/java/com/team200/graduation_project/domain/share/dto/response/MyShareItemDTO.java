package com.team200.graduation_project.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyShareItemDTO {
    private UUID postId;
    private String image;
    private String title;
    private String ingredientName;
    private String category;
    private String content;
    private LocalDate expirationDate;
    private String locationName;
    private Double latitude;
    private Double longitude;
}
