package com.team200.graduation_project.domain.ingredient.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AllergyUpdateRequest {

    @JsonProperty("oldallergy")
    private List<String> oldAllergy;

    @JsonProperty("newallergy")
    private List<String> newAllergy;
}

