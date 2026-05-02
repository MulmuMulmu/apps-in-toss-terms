package com.team200.graduation_project.domain.ingredient.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UserIngredientPageResponse {
    private List<UserIngredientSearchResponse> items;
    private long totalCount;
    private int page;
    private int size;
    private boolean hasNext;
}
