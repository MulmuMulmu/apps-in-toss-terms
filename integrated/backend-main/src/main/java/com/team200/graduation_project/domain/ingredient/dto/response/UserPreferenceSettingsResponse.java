package com.team200.graduation_project.domain.ingredient.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserPreferenceSettingsResponse {

    private List<String> allergies;
    private List<String> preferIngredients;
    private List<String> dispreferIngredients;
}
