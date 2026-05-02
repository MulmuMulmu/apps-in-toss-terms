package com.team200.graduation_project.domain.user.service;

import com.team200.graduation_project.domain.user.dto.request.ChangePasswordRequest;
import com.team200.graduation_project.domain.user.client.AppsInTossLoginClient;
import com.team200.graduation_project.domain.user.client.AppsInTossUserInfo;
import com.team200.graduation_project.domain.user.dto.request.KakaoSignupRequest;
import com.team200.graduation_project.domain.user.dto.request.LoginRequest;
import com.team200.graduation_project.domain.user.dto.request.TossLoginRequest;
import com.team200.graduation_project.domain.user.dto.request.UserSignupRequest;
import com.team200.graduation_project.domain.user.dto.response.LoginResponse;
import com.team200.graduation_project.domain.user.dto.response.UserMypageResponse;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.exception.UserErrorCode;
import com.team200.graduation_project.domain.user.exception.UserException;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenPair;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import com.team200.graduation_project.global.jwt.JwtTokenService;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtTokenService jwtTokenService;
    private final Storage storage;
    private final AppsInTossLoginClient appsInTossLoginClient;

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    public String checkIdDuplicated(String id) {
        if (!StringUtils.hasText(id)) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }

        if (userRepository.existsByUserIdIs(id)) {
            throw new UserException(UserErrorCode.USER_ID_DUPLICATED);
        }

        return "사용가능한 id 입니다.";
    }

    @Transactional
    public String signup(UserSignupRequest request) {
        validateSignupRequest(request);

        if (userRepository.existsByUserIdIs(request.getId())) {
            throw new UserException(UserErrorCode.USER_ID_DUPLICATED);
        }

        try {
            User user = User.builder()
                    .userId(request.getId())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .nickName(request.getName())
                    .imageUrl("https://storage.googleapis.com/mulmumulmu_picture/profilePicture/%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%89%E1%85%A1%E1%84%8C%E1%85%B5%E1%86%AB.png")
                    .firstLogin(true)
                    .warmingCount(0L)
                    .deletedAt(null)
                    .status(UserStatus.NORMAL)
                    .role(Role.USER)
                    .build();

            userRepository.save(user);
            return "회원가입이 완료되었습니다";
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new UserException(UserErrorCode.USER_SIGNUP_FAILED);
        }
    }

    @Transactional
    public String signupWithKakao(KakaoSignupRequest request) {
        validateKakaoAuthorizationCodeForSignup(request);
        String kakaoId = kakaoUserIdFromAuthorizationCode(request.getAuthorizationCode());

        try {
            if (!userRepository.existsByUserIdIs(kakaoId)) {
                User user = User.builder()
                        .userId(kakaoId)
                        .password(null)
                        .nickName("kakao_user")
                        .imageUrl("https://storage.googleapis.com/mulmumulmu_picture/profilePicture/%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%89%E1%85%A1%E1%84%8C%E1%85%B5%E1%86%AB.png")
                        .firstLogin(true)
                        .warmingCount(0L)
                        .deletedAt(null)
                        .status(UserStatus.NORMAL)
                        .role(Role.USER)
                        .build();
                userRepository.save(user);
            }
            return "회원가입이 완료되었습니다";
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_SIGNUP_FAILED);
        }
    }

    private void validateSignupRequest(UserSignupRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getName())
                || !StringUtils.hasText(request.getId())
                || !StringUtils.hasText(request.getPassword())
                || !StringUtils.hasText(request.getCheckPassword())) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }

        if (!request.getPassword().equals(request.getCheckPassword())) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }
    }

    private void validateKakaoAuthorizationCodeForSignup(KakaoSignupRequest request) {
        if (request == null || !StringUtils.hasText(request.getAuthorizationCode())) {
            throw new UserException(UserErrorCode.USER_KAKAO_TOKEN_NOT_FOUND);
        }
    }

    private String kakaoUserIdFromAuthorizationCode(String authorizationCode) {
        String accessToken = "kakao_access_token_" + authorizationCode;
        return "kakao_" + Math.abs(accessToken.hashCode());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.getId()) || !StringUtils.hasText(request.getPassword())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        User user = userRepository
                .findByUserIdIsAndDeletedAtIsNull(request.getId())
                .orElseThrow(() -> new UserException(UserErrorCode.USER_LOGIN_FAILED));

        if (user.getStatus() != UserStatus.NORMAL) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        if (!StringUtils.hasText(user.getPassword())
                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        JwtTokenPair tokenPair = jwtTokenService.issueTokenPair(user.getUserId());
        return new LoginResponse(tokenPair.accessToken(), user.getFirstLogin());
    }

    @Transactional(readOnly = true)
    public LoginResponse loginWithKakao(KakaoSignupRequest request) {
        if (request == null || !StringUtils.hasText(request.getAuthorizationCode())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        String kakaoId = kakaoUserIdFromAuthorizationCode(request.getAuthorizationCode());
        User user = userRepository
                .findByUserIdIsAndDeletedAtIsNull(kakaoId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_LOGIN_FAILED));

        if (user.getStatus() != UserStatus.NORMAL) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        JwtTokenPair tokenPair = jwtTokenService.issueTokenPair(user.getUserId());
        return new LoginResponse(tokenPair.accessToken(), user.getFirstLogin());
    }

    @Transactional
    public LoginResponse loginWithToss(TossLoginRequest request) {
        if (request == null || !StringUtils.hasText(request.authorizationCode())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        String referrer = StringUtils.hasText(request.referrer()) ? request.referrer() : "DEFAULT";
        AppsInTossUserInfo userInfo = appsInTossLoginClient.login(request.authorizationCode(), referrer);
        if (userInfo == null || !StringUtils.hasText(userInfo.userKey())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        User user = userRepository.findByTossUserKeyAndDeletedAtIsNull(userInfo.userKey())
                .orElseGet(() -> createTossUser(userInfo));
        user.updateAppsInTossLoginMetadata(userInfo.scope(), joinAgreedTerms(userInfo.agreedTerms()));

        if (user.getStatus() != UserStatus.NORMAL) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }

        JwtTokenPair tokenPair = jwtTokenService.issueTokenPair(user.getUserId());
        return new LoginResponse(tokenPair.accessToken(), user.getFirstLogin());
    }

    private User createTossUser(AppsInTossUserInfo userInfo) {
        String tossUserKey = userInfo.userKey();
        String baseUserId = "toss_" + tossUserKey;
        String userId = baseUserId;
        int suffix = 1;
        while (userRepository.existsByUserIdIs(userId)) {
            userId = baseUserId + "_" + suffix++;
        }

        User user = User.builder()
                .userId(userId)
                .tossUserKey(tossUserKey)
                .tossScope(userInfo.scope())
                .tossAgreedTerms(joinAgreedTerms(userInfo.agreedTerms()))
                .password(null)
                .nickName("토스사용자" + lastFour(tossUserKey))
                .imageUrl("https://storage.googleapis.com/mulmumulmu_picture/profilePicture/%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%89%E1%85%A1%E1%84%8C%E1%85%B5%E1%86%AB.png")
                .firstLogin(true)
                .warmingCount(0L)
                .deletedAt(null)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private String joinAgreedTerms(List<String> agreedTerms) {
        if (agreedTerms == null || agreedTerms.isEmpty()) {
            return "";
        }
        return String.join(",", agreedTerms);
    }

    private String lastFour(String value) {
        if (value.length() <= 4) {
            return value;
        }
        return value.substring(value.length() - 4);
    }


    @Transactional
    public String changeNickname(String authorizationHeader, com.team200.graduation_project.domain.user.dto.request.ChangeNicknameRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getOldnickName())
                || !StringUtils.hasText(request.getNewnickName())) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);

            if (!request.getOldnickName().equals(user.getNickName())) {
                throw new UserException(UserErrorCode.USER_NICKNAME_MISMATCH);
            }

            user.updateNickName(request.getNewnickName());
            return "닉네임이 성공적으로 변경되었습니다.";
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_NICKNAME_CHANGE_FAILED);
        }
    }

    @Transactional
    public String changePassword(String authorizationHeader, ChangePasswordRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getOldPassword())
                || !StringUtils.hasText(request.getNewPassword())) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);

            if (!StringUtils.hasText(user.getPassword())
                    || !passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new UserException(UserErrorCode.USER_PASSWORD_MISMATCH);
            }

            user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
            return "비밀번호가 성공적으로 변경되었습니다.";
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_PASSWORD_CHANGE_FAILED);
        }
    }

    @Transactional
    public String updateProfilePicture(String authorizationHeader, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new UserException(UserErrorCode.USER_BAD_REQUEST);
        }

        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            String imageUrl = uploadProfilePictureToGcp(image, user.getNickName());
            user.updateImageUrl(imageUrl);
            return "프로필사진이 변경되었습니다.";
        } catch (UserException | GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_PROFILE_PICTURE_UPLOAD_FAILED);
        }
    }

    private String uploadProfilePictureToGcp(MultipartFile file, String nickName) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String fileName = String.format("profilePicture/%s/%s_%s", nickName, uuid, file.getOriginalFilename());
        String contentType = file.getContentType();

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(contentType)
                .build();

        storage.create(blobInfo, file.getBytes());

        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }

    public String logout(String authorizationHeader) {
        try {
            return "로그아웃 완료되었습니다.";
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_LOGOUT_FAILED);
        }
    }

    @Transactional
    public String deleteAccount(String authorizationHeader) {
        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            user.softDelete();
            return "회원탈퇴가 완료되었습니다.";
        } catch (UserException | GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_DELETION_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public UserMypageResponse getMypage(String authorizationHeader) {
        try {
            User user = findUserFromAuthorizationHeader(authorizationHeader);
            return UserMypageResponse.builder()
                    .nickName(user.getNickName())
                    .profileImageUrl(user.getImageUrl())
                    .build();
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_MYPAGE_FAILED);
        }
    }

    private User findUserFromAuthorizationHeader(String authorizationHeader) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String userId = jwtTokenProvider.getSubject(token);
        return userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.UNAUTHORIZED));
    }

    private String extractAccessToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String bearerPrefix = "Bearer ";
        if (authorizationHeader.startsWith(bearerPrefix)) {
            return authorizationHeader.substring(bearerPrefix.length()).trim();
        }

        return authorizationHeader.trim();
    }
}
