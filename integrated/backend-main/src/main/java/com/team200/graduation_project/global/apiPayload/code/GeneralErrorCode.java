package com.team200.graduation_project.global.apiPayload.code;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum GeneralErrorCode {

    BAD_REQUEST(HttpStatus.BAD_REQUEST,
            "COMMON400", "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED,
            "AUTH401", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN,
            "AUTH403", "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND,
            "COMMON404", "리소스를 찾을 수 없습니다."),
    ALLERGY_UPDATE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "알러지를 수정할 수 있습니다."),
    PREFER_UPDATE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "선호, 비선호 목록을 수정할 수 없습니다."),
    INGREDIENT_SAVE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "식재료를 저장할 수 없습니다."),
    INGREDIENT_CALCULATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "식재료 목록을 계산할 수 없습니다."),
    INGREDIENT_COUNT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "소비기한 3일 내 식자재 개수를 불러올 수 없습니다."),
    INGREDIENT_NEAR_EXPIRATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "유통기한 임박 식재료를 불러올 수 없습니다."),
    INVALID_REQUEST_ARGUMENT(HttpStatus.BAD_REQUEST,
            "COMMON400", "reqeust 값을 정확하게 입력하여 주세요."),
    LOCATION_FETCH_FAILED(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "위치를 불러올 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR,
            "COMMON500", "예기치 않은 서버 에러가 발생했습니다."),
    INGREDIENT_NOT_FOUNDED(HttpStatus.BAD_REQUEST,"COMMON400","식재료 db에 식품을 찾을 수 없습니다."),
    LOCATION_NOT_FOUND(HttpStatus.NOT_FOUND,"COMMON404","위치 정보를 찾을 수 없습니다");


    private final HttpStatus status;
    private final String code;
    private final String message;

}
