package com.team200.graduation_project.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {
    private String full_address;
    private String display_address;
    private Double latitude;
    private Double longitude;
}
