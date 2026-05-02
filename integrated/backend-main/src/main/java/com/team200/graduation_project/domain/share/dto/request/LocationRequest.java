package com.team200.graduation_project.domain.share.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequest {
    private Double latitude;
    private Double longitude;
}
