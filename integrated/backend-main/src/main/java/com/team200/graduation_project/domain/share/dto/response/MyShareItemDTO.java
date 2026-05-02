package com.team200.graduation_project.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyShareItemDTO {
    private UUID postId;
    private String image;
    private String title;
    private String content;
}
