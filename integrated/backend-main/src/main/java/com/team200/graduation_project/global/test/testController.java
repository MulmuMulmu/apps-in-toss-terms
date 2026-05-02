package com.team200.graduation_project.global.test;

import com.team200.graduation_project.global.apiPayload.ApiResponse;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class testController {

    @GetMapping("/test/health-check")
    public ApiResponse<?> get() {
        return ApiResponse.onSuccess("server is running");
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/test/custom-exception")
    public ApiResponse<String> login(@RequestBody String code) {
        if (code != null) {

            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
        return ApiResponse.onSuccess("로그인 성공!");
    }


}
