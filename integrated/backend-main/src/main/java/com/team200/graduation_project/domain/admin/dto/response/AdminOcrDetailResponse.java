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
public class AdminOcrDetailResponse {
    private String receiptImage;
    private LocalDateTime purchaseTime;
    private LocalDateTime createTime;
    private String userId;
    private String tossUserKey;
    private String loginProvider;
    private String nickName;
    private Double accuracy;
}
