package com.team200.graduation_project.domain.share.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ShareErrorCode {

    SHARE_BAD_REQUEST(HttpStatus.BAD_REQUEST, "SHARE400", "잘못된 요청입니다."),
    SHARE_NOT_FOUND(HttpStatus.NOT_FOUND, "SHARE404", "리소스를 찾을 수 없습니다."),
    SHARE_POSTING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "게시글을 등록할 수 없습니다."),
    SHARE_POSTING_NOT_FOUND(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "나눔 정보를 불러올 수 없습니다."),
    MY_SHARE_LIST_FETCH_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "내 나눔 기록을 불러올 수 없습니다."),
    USER_INGREDIENT_NOT_FOUND(HttpStatus.NOT_FOUND, "SHARE404", "해당 식재료를 찾을 수 없거나 권한이 없습니다."),
    SHARE_ITEM_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "SHARE400", "나눔할 수 없는 품목입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
