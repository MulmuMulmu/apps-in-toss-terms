package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserListResponse {
    private Integer number;
    private String userId;
    private String tossUserKey;
    private String loginProvider;
    private String nickName;
    private String status;
    private Long totalWarming;
    private Long totalIngredient;
    private Long totalOcr;
    private Long totalShare;
}
