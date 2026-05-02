package com.team200.graduation_project.domain.ingredient.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserIngredientSearchRequest {
    @Schema(description = "필터링할 카테고리 목록 (예: 과일,고기)", example = "[\"과일\", \"고기\"]")
    private List<String> category;

    @Schema(description = "정렬 기준 (date&ascending, date&descending, name&ascending, name&descending)", example = "date&ascending")
    private String sort;
}
