package com.team200.graduation_project.global.apiPayload;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonPropertyOrder({"success", "code", "result"})
public class ApiResponse<T> {

    @JsonProperty("success")
    private final Boolean success;

    @JsonProperty("code")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String code;

    @JsonProperty("result")
    private T result;

    public static <T> ApiResponse<T> onSuccess(T result) {
        return new ApiResponse<>(true, null, result);
    }

    public static <T> ApiResponse<T> onFailure(String code, T result) {
        return new ApiResponse<>(false, code , result);
    }
}
