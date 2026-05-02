package com.team200.graduation_project.domain.user.controller;

import com.team200.graduation_project.domain.user.dto.request.ChangePasswordRequest;
import com.team200.graduation_project.domain.user.dto.request.ChangeNicknameRequest;
import com.team200.graduation_project.domain.user.dto.request.KakaoSignupRequest;
import com.team200.graduation_project.domain.user.dto.request.LoginRequest;
import com.team200.graduation_project.domain.user.dto.request.TossLoginRequest;
import com.team200.graduation_project.domain.user.dto.request.UserSignupRequest;
import com.team200.graduation_project.domain.user.dto.response.LoginResponse;
import com.team200.graduation_project.domain.user.dto.response.UserMypageResponse;
import com.team200.graduation_project.domain.user.service.UserService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController implements UserControllerDocs {

    private final UserService userService;

    @GetMapping("/signup/idCheck")
    @Override
    public ApiResponse<String> checkIdDuplicated(@RequestParam("id") String id) {
        return ApiResponse.onSuccess(userService.checkIdDuplicated(id));
    }

    @PostMapping("/signup")
    @Override
    public ApiResponse<String> signup(@RequestBody UserSignupRequest request) {
        return ApiResponse.onSuccess(userService.signup(request));
    }

    @PostMapping("/signup/kakao")
    @Override
    public ApiResponse<String> signupWithKakao(@RequestBody KakaoSignupRequest request) {
        return ApiResponse.onSuccess(userService.signupWithKakao(request));
    }

    @PostMapping("/login")
    @Override
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        return ApiResponse.onSuccess(userService.login(request));
    }

    @PostMapping("/login/kakao")
    @Override
    public ApiResponse<LoginResponse> loginWithKakao(@RequestBody KakaoSignupRequest request) {
        return ApiResponse.onSuccess(userService.loginWithKakao(request));
    }

    @PostMapping("/toss/login")
    @Override
    public ApiResponse<LoginResponse> loginWithToss(@RequestBody TossLoginRequest request) {
        return ApiResponse.onSuccess(userService.loginWithToss(request));
    }

    @PostMapping("/logout")
    @Override
    public ApiResponse<String> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ApiResponse.onSuccess(userService.logout(authorizationHeader));
    }

    @DeleteMapping("/deletion")
    @Override
    public ApiResponse<String> deleteAccount(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ApiResponse.onSuccess(userService.deleteAccount(authorizationHeader));
    }

    @PutMapping("/password")
    @Override
    public ApiResponse<String> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody ChangePasswordRequest request
    ) {
        return ApiResponse.onSuccess(userService.changePassword(authorizationHeader, request));
    }

    @PutMapping("/nickName")
    @Override
    public ApiResponse<String> changeNickname(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody ChangeNicknameRequest request
    ) {
        return ApiResponse.onSuccess(userService.changeNickname(authorizationHeader, request));
    }

    @PutMapping(value = "/mypage/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Override
    public ApiResponse<String> updateProfilePicture(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestPart("image") MultipartFile image
    ) {
        return ApiResponse.onSuccess(userService.updateProfilePicture(authorizationHeader, image));
    }

    @GetMapping("/mypage")
    @Override
    public ApiResponse<UserMypageResponse> getMypage(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ApiResponse.onSuccess(userService.getMypage(authorizationHeader));
    }
}
