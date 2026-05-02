package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDashboardResponse {
    private Long totalUsers;
    private Long atLeastOneWarming;
    private Long permanentSuspension;
}
