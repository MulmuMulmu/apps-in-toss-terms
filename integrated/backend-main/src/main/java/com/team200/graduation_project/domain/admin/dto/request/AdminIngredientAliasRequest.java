package com.team200.graduation_project.domain.admin.dto.request;

import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminIngredientAliasRequest {

    private String aliasName;
    private String ingredientName;
    private String source;
}
