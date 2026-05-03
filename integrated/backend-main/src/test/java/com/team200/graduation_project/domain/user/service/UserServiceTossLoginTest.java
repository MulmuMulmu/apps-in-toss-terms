package com.team200.graduation_project.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.AdditionalAnswers.returnsFirstArg;

import com.google.cloud.storage.Storage;
import com.team200.graduation_project.domain.user.client.AppsInTossLoginClient;
import com.team200.graduation_project.domain.user.client.AppsInTossToken;
import com.team200.graduation_project.domain.user.client.AppsInTossAccessRemovalClient;
import com.team200.graduation_project.domain.user.client.AppsInTossUserInfo;
import com.team200.graduation_project.domain.user.dto.request.TossLoginRequest;
import com.team200.graduation_project.domain.user.dto.response.LoginResponse;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.exception.UserException;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.jwt.JwtTokenPair;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import com.team200.graduation_project.global.jwt.JwtTokenService;
import java.util.Optional;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserServiceTossLoginTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private Storage storage;

    @Mock
    private AppsInTossLoginClient appsInTossLoginClient;

    @Mock
    private AppsInTossAccessRemovalClient appsInTossAccessRemovalClient;

    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userService = new UserService(
                userRepository,
                passwordEncoder,
                jwtTokenProvider,
                jwtTokenService,
                storage,
                appsInTossLoginClient,
                appsInTossAccessRemovalClient
        );
    }

    @Test
    void loginWithTossCreatesUserWhenTossUserIsNew() {
        when(appsInTossLoginClient.login("code-123", "DEFAULT"))
                .thenReturn(new AppsInTossUserInfo(
                        "443731104",
                        "user_name,user_gender",
                        java.util.List.of("service_terms"),
                        "toss-access-token",
                        "toss-refresh-token",
                        3599L
                ));
        when(userRepository.findByTossUserKeyAndDeletedAtIsNull("443731104"))
                .thenReturn(Optional.empty());
        when(userRepository.findByTossUserKey("443731104"))
                .thenReturn(Optional.empty());
        when(userRepository.existsByUserIdIs("toss_443731104")).thenReturn(false);
        when(userRepository.save(any(User.class))).then(returnsFirstArg());
        when(jwtTokenService.issueTokenPair("toss_443731104"))
                .thenReturn(new JwtTokenPair("access-token", "refresh-token"));

        LoginResponse response = userService.loginWithToss(new TossLoginRequest("code-123", "DEFAULT"));

        assertThat(response.getJwt()).isEqualTo("access-token");
        assertThat(response.getFirstLogin()).isTrue();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo("toss_443731104");
        assertThat(saved.getTossUserKey()).isEqualTo("443731104");
        assertThat(saved.getTossScope()).isEqualTo("user_name,user_gender");
        assertThat(saved.getTossAgreedTerms()).isEqualTo("service_terms");
        assertThat(saved.getTossAccessToken()).isEqualTo("toss-access-token");
        assertThat(saved.getTossRefreshToken()).isEqualTo("toss-refresh-token");
        assertThat(saved.getTossAccessTokenExpiresAt()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.NORMAL);
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void loginWithTossIssuesJwtForExistingTossUser() {
        User existing = User.builder()
                .userId("toss_443731104")
                .tossUserKey("443731104")
                .password(null)
                .nickName("토스사용자1104")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .warmingCount(0L)
                .build();

        when(appsInTossLoginClient.login("code-123", "DEFAULT"))
                .thenReturn(new AppsInTossUserInfo(
                        "443731104",
                        "user_name",
                        java.util.List.of("service_terms"),
                        "updated-access-token",
                        "updated-refresh-token",
                        3599L
                ));
        when(userRepository.findByTossUserKeyAndDeletedAtIsNull("443731104"))
                .thenReturn(Optional.of(existing));
        when(jwtTokenService.issueTokenPair("toss_443731104"))
                .thenReturn(new JwtTokenPair("access-token", "refresh-token"));

        LoginResponse response = userService.loginWithToss(new TossLoginRequest("code-123", "DEFAULT"));

        assertThat(response.getJwt()).isEqualTo("access-token");
        assertThat(response.getFirstLogin()).isFalse();
        assertThat(existing.getTossAccessToken()).isEqualTo("updated-access-token");
        assertThat(existing.getTossRefreshToken()).isEqualTo("updated-refresh-token");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginWithTossReleasesWithdrawnTossKeyBeforeRejoin() {
        User withdrawn = User.builder()
                .userId("toss_443731104")
                .tossUserKey("443731104")
                .tossScope("user_name")
                .tossAgreedTerms("service_terms")
                .password(null)
                .nickName("토스사용자1104")
                .firstLogin(false)
                .status(UserStatus.WITHDRAWN)
                .role(Role.USER)
                .warmingCount(0L)
                .build();

        when(appsInTossLoginClient.login("code-123", "DEFAULT"))
                .thenReturn(new AppsInTossUserInfo("443731104", "user_name", java.util.List.of("service_terms")));
        when(userRepository.findByTossUserKeyAndDeletedAtIsNull("443731104"))
                .thenReturn(Optional.empty());
        when(userRepository.findByTossUserKey("443731104"))
                .thenReturn(Optional.of(withdrawn));
        when(userRepository.existsByUserIdIs("toss_443731104")).thenReturn(true);
        when(userRepository.existsByUserIdIs("toss_443731104_1")).thenReturn(false);
        when(userRepository.save(any(User.class))).then(returnsFirstArg());
        when(jwtTokenService.issueTokenPair("toss_443731104_1"))
                .thenReturn(new JwtTokenPair("access-token", "refresh-token"));

        LoginResponse response = userService.loginWithToss(new TossLoginRequest("code-123", "DEFAULT"));

        assertThat(response.getJwt()).isEqualTo("access-token");
        assertThat(response.getFirstLogin()).isTrue();
        assertThat(withdrawn.getTossUserKey()).isNull();
        assertThat(withdrawn.getTossScope()).isEmpty();
        assertThat(withdrawn.getTossAgreedTerms()).isEmpty();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("toss_443731104_1");
        assertThat(captor.getValue().getTossUserKey()).isEqualTo("443731104");
        verify(userRepository).flush();
    }

    @Test
    void loginWithTossRejectsEmptyAuthorizationCode() {
        assertThatThrownBy(() -> userService.loginWithToss(new TossLoginRequest("", "DEFAULT")))
                .isInstanceOf(UserException.class);
    }

    @Test
    void deleteAccountRemovesAppsInTossConnectionBeforeSoftDelete() {
        User user = User.builder()
                .userId("toss_443731104")
                .tossUserKey("443731104")
                .tossAccessToken("stored-access-token")
                .password(null)
                .nickName("토스사용자1104")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .warmingCount(0L)
                .build();

        when(jwtTokenProvider.validateToken("jwt-token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("jwt-token")).thenReturn("toss_443731104");
        when(userRepository.findByUserIdIsAndDeletedAtIsNull("toss_443731104"))
                .thenReturn(Optional.of(user));

        String result = userService.deleteAccount("Bearer jwt-token");

        assertThat(result).isEqualTo("회원탈퇴가 완료되었습니다.");
        verify(appsInTossAccessRemovalClient).removeByUserKey("stored-access-token", "443731104");
        assertThat(user.getStatus()).isEqualTo(UserStatus.WITHDRAWN);
        assertThat(user.getTossUserKey()).isNull();
        assertThat(user.getTossAccessToken()).isNull();
    }

    @Test
    void deleteAccountRefreshesExpiredAppsInTossAccessTokenBeforeUnlink() {
        User user = User.builder()
                .userId("toss_443731104")
                .tossUserKey("443731104")
                .tossAccessToken("expired-access-token")
                .tossRefreshToken("stored-refresh-token")
                .tossAccessTokenExpiresAt(LocalDateTime.now().minusMinutes(1))
                .password(null)
                .nickName("토스사용자1104")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .warmingCount(0L)
                .build();

        when(jwtTokenProvider.validateToken("jwt-token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("jwt-token")).thenReturn("toss_443731104");
        when(userRepository.findByUserIdIsAndDeletedAtIsNull("toss_443731104"))
                .thenReturn(Optional.of(user));
        when(appsInTossLoginClient.refreshToken("stored-refresh-token"))
                .thenReturn(new AppsInTossToken("fresh-access-token", "fresh-refresh-token", 3599L));

        userService.deleteAccount("Bearer jwt-token");

        verify(appsInTossAccessRemovalClient).removeByUserKey("fresh-access-token", "443731104");
        assertThat(user.getTossUserKey()).isNull();
    }

    @Test
    void handleAppsInTossUnlinkCallbackReleasesStoredConnection() {
        User user = User.builder()
                .userId("toss_443731104")
                .tossUserKey("443731104")
                .tossScope("user_name")
                .tossAgreedTerms("service_terms")
                .tossAccessToken("stored-access-token")
                .tossRefreshToken("stored-refresh-token")
                .password(null)
                .nickName("토스사용자1104")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .warmingCount(0L)
                .build();

        when(userRepository.findByTossUserKey("443731104")).thenReturn(Optional.of(user));

        String result = userService.handleAppsInTossUnlinkCallback("443731104", "UNLINK");

        assertThat(result).isEqualTo("토스 로그인 연결 해제 콜백이 처리되었습니다.");
        assertThat(user.getTossUserKey()).isNull();
        assertThat(user.getTossAccessToken()).isNull();
        assertThat(user.getTossRefreshToken()).isNull();
    }
}
