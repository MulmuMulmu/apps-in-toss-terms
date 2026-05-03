package com.team200.graduation_project.domain.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AdminLoginRequest {

    @Schema(description = "관리자 아이디 (이메일 형태)", example = "admin@example.com")
    private String email;

    @Schema(description = "관리자 비밀번호", example = "<password>")
    private String password;
}
