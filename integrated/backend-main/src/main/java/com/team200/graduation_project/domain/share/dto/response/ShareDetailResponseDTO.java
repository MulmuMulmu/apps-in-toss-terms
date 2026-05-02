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
    private String sellerName;
    private String title;
    private String category;
    private String content;
    private LocalDate expirationDate;
    private LocalDateTime createTime;
}
