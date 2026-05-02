package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportListResponse {
    private List<ReportItemDTO> reports;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportItemDTO {
        private UUID reportId;
        private UUID shareId;
        private String reporterName;
        private String reporterUserId;
        private String reporterTossUserKey;
        private String reporterLoginProvider;
        private String reportedName;
        private String reportedUserId;
        private String reportedTossUserKey;
        private String reportedLoginProvider;
        private String reportType;
        private String reportTypeLabel;
        private String chatRoomId;
        private String content;
        private String status;
    }
}
