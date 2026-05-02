package com.team200.graduation_project.domain.ingredient.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ExtraInfoRequest {

    private List<String> allergies;

    @JsonProperty("prefer_ingredients")
    private List<String> preferIngredients;

    @JsonProperty("disprefer_ingredients")
    private List<String> dispreferIngredients;
}

