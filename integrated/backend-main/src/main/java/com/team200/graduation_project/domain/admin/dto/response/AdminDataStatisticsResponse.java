package com.team200.graduation_project.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDataStatisticsResponse {
    private LocalDate date;
    private List<Object> rank1;
    private List<Object> rank2;
    private List<Object> rank3;
    private Long total;
}
