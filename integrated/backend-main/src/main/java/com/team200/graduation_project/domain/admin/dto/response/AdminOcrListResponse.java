package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOcrListResponse {
    private UUID ocrId;
    private String userId;
    private String tossUserKey;
    private String loginProvider;
    private String nickName;
    private LocalDateTime createTime;
    private Double accuracy;
}
