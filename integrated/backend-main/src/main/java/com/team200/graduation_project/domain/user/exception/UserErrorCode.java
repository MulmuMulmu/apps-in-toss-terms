package com.team200.graduation_project.domain.user.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum UserErrorCode {

    USER_BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON400", "잘못된 요청입니다."),
    USER_ID_DUPLICATED(HttpStatus.BAD_REQUEST, "COMMON400", "중복된 id가 이미 있습니다."),
    USER_KAKAO_TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "COMMON400", "카카오 토큰 값을 불러올 수 없습니다."),
    USER_PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "COMMON400", "이전 비밀번호가 일치하지 않습니다."),
    USER_SIGNUP_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "회원가입을 완료할 수 없습니다."),
    USER_LOGIN_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "로그인 할 수 없습니다."),
    USER_PASSWORD_CHANGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "비밀번호를 변경할 수 없습니다."),
    USER_NICKNAME_MISMATCH(HttpStatus.BAD_REQUEST, "COMMON400", "이전 닉네임이 일치하지 않습니다."),
    USER_NICKNAME_CHANGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "닉네임을 변경할 수 없습니다."),
    USER_PROFILE_PICTURE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "사진을 불러올 수 없습니다."),
    USER_LOGOUT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "로그아웃 할 수 없습니다"),
    USER_DELETION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "회원탈퇴를 할 수 없습니다."),
    USER_MYPAGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "사용자 정보를 불러올 수 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER404", "리소스를 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
