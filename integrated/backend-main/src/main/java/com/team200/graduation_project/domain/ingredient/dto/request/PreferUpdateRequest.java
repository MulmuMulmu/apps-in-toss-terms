package com.team200.graduation_project.domain.ingredient.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PreferUpdateRequest {

    private String type;

    @JsonProperty("oldPrefer")
    private List<String> oldPrefer;

    @JsonProperty("newPrefer")
    private List<String> newPrefer;
}

