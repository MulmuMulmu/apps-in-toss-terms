package com.team200.graduation_project.domain.user.controller;

import com.team200.graduation_project.domain.user.dto.response.LoginResponse;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import com.team200.graduation_project.global.jwt.JwtTokenPair;
import com.team200.graduation_project.global.jwt.JwtTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("local")
@RestController
@RequestMapping("/auth/local")
@RequiredArgsConstructor
public class LocalAuthController {

    private static final String LOCAL_USER_ID = "local-preview-user";
    private static final String DEFAULT_PROFILE_IMAGE =
            "https://storage.googleapis.com/mulmumulmu_picture/profilePicture/%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%89%E1%85%A1%E1%84%8C%E1%85%B5%E1%86%AB.png";

    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login() {
        User user = userRepository.findByUserIdIsAndDeletedAtIsNull(LOCAL_USER_ID)
                .orElseGet(this::createLocalUser);
        JwtTokenPair tokenPair = jwtTokenService.issueTokenPair(user.getUserId());
        return ApiResponse.onSuccess(new LoginResponse(tokenPair.accessToken(), false));
    }

    private User createLocalUser() {
        User user = User.builder()
                .userId(LOCAL_USER_ID)
                .password(null)
                .nickName("로컬 테스트 사용자")
                .imageUrl(DEFAULT_PROFILE_IMAGE)
                .firstLogin(false)
                .warmingCount(0L)
                .deletedAt(null)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }
}
