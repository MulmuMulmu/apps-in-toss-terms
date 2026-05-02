package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportDetailResponse {
    private String reporterName;
    private String reporterUserId;
    private String reporterTossUserKey;
    private String reporterLoginProvider;
    private String reportedName;
    private String reportedNameId;
    private String reportedTossUserKey;
    private String reportedLoginProvider;
    private String reportType;
    private String reportTypeLabel;
    private String chatRoomId;
    private Long totalWarming;
    private String title;
    private String content;
}
