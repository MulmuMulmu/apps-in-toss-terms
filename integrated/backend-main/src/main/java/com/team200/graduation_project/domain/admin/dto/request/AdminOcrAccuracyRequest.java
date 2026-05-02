package com.team200.graduation_project.domain.admin.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
public class AdminOcrAccuracyRequest {
    private UUID ocrId;
    private Double accuracy;
}
