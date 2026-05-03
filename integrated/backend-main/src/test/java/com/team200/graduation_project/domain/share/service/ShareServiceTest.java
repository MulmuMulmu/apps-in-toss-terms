package com.team200.graduation_project.domain.share.service;

import com.google.cloud.storage.Storage;
import com.team200.graduation_project.domain.ingredient.repository.UserIngredientRepository;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredientStatus;
import com.team200.graduation_project.domain.share.client.KakaoLocalClient;
import com.team200.graduation_project.domain.share.converter.ShareConverter;
import com.team200.graduation_project.domain.share.dto.external.KakaoAddressResponse;
import com.team200.graduation_project.domain.share.dto.request.LocationRequest;
import com.team200.graduation_project.domain.share.dto.request.ShareRequestDTO;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.ShareHiddenPost;
import com.team200.graduation_project.domain.share.entity.ShareStatus;
import com.team200.graduation_project.domain.share.exception.ShareException;
import com.team200.graduation_project.domain.share.policy.ShareEligibilityPolicy;
import com.team200.graduation_project.domain.share.repository.ChatRoomRepository;
import com.team200.graduation_project.domain.share.repository.ReportRepository;
import com.team200.graduation_project.domain.share.repository.ShareHiddenPostRepository;
import com.team200.graduation_project.domain.share.repository.SharePictureRepository;
import com.team200.graduation_project.domain.share.repository.ShareRepository;
import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.LocationRepository;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShareServiceTest {

    @Mock
    private KakaoLocalClient kakaoLocalClient;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LocationRepository locationRepository;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private ShareRepository shareRepository;
    @Mock
    private SharePictureRepository sharePictureRepository;
    @Mock
    private ShareHiddenPostRepository shareHiddenPostRepository;
    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private UserIngredientRepository userIngredientRepository;
    @Mock
    private ShareConverter shareConverter;
    @Mock
    private ShareEligibilityPolicy shareEligibilityPolicy;
    @Mock
    private Storage storage;

    @InjectMocks
    private ShareService shareService;

    @Test
    void publishSharePostingRequiresSavedShareLocation() {
        User user = User.builder()
                .userId("user-without-location")
                .nickName("위치없음")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        ShareRequestDTO request = ShareRequestDTO.builder()
                .title("양파 나눔")
                .ingredientName("양파")
                .content("미개봉 양파입니다.")
                .category("채소/과일")
                .expirationDate(LocalDate.now().plusDays(3))
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn(user.getUserId());
        when(userRepository.findByUserIdIsAndDeletedAtIsNull(user.getUserId())).thenReturn(Optional.of(user));
        when(locationRepository.findByUser(user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareService.publishSharePosting("Bearer token", request))
                .isInstanceOf(GeneralException.class)
                .satisfies(error -> assertThat(((GeneralException) error).getStatus()).isEqualTo(GeneralErrorCode.LOCATION_NOT_FOUND));
        verify(userIngredientRepository, never()).findByUserAndIngredient_IngredientName(user, "양파");
    }

    @Test
    void addLocationRejectsManualNeighborhoodWhenCurrentPositionIsTooFar() {
        ReflectionTestUtils.setField(shareService, "locationVerificationRadiusKm", 3.0);
        User user = User.builder()
                .userId("user-location-verify")
                .nickName("위치인증")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        LocationRequest request = LocationRequest.builder()
                .latitude(37.4836)
                .longitude(127.0327)
                .verificationLatitude(37.5665)
                .verificationLongitude(126.9780)
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn(user.getUserId());
        when(userRepository.findByUserIdIsAndDeletedAtIsNull(user.getUserId())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> shareService.addLocation("Bearer token", request))
                .isInstanceOf(GeneralException.class)
                .satisfies(error -> assertThat(((GeneralException) error).getStatus()).isEqualTo(GeneralErrorCode.LOCATION_VERIFICATION_FAILED));
        verify(kakaoLocalClient, never()).coord2address(request.getLongitude(), request.getLatitude());
        verify(locationRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void addLocationRequiresVerificationCoordinates() {
        ReflectionTestUtils.setField(shareService, "locationVerificationRadiusKm", 3.0);
        User user = User.builder()
                .userId("user-location-missing-verification")
                .nickName("인증없음")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        LocationRequest request = LocationRequest.builder()
                .latitude(37.4610)
                .longitude(127.1260)
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn(user.getUserId());
        when(userRepository.findByUserIdIsAndDeletedAtIsNull(user.getUserId())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> shareService.addLocation("Bearer token", request))
                .isInstanceOf(GeneralException.class)
                .satisfies(error -> assertThat(((GeneralException) error).getStatus()).isEqualTo(GeneralErrorCode.LOCATION_VERIFICATION_FAILED));
        verify(kakaoLocalClient, never()).coord2address(request.getLongitude(), request.getLatitude());
        verify(locationRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void addLocationSavesManualNeighborhoodWhenCurrentPositionIsNearby() {
        ReflectionTestUtils.setField(shareService, "locationVerificationRadiusKm", 3.0);
        User user = User.builder()
                .userId("user-location-nearby")
                .nickName("근처인증")
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
        LocationRequest request = LocationRequest.builder()
                .latitude(37.4610)
                .longitude(127.1260)
                .verificationLatitude(37.4620)
                .verificationLongitude(127.1270)
                .build();

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn(user.getUserId());
        when(userRepository.findByUserIdIsAndDeletedAtIsNull(user.getUserId())).thenReturn(Optional.of(user));
        when(kakaoLocalClient.coord2address(request.getLongitude(), request.getLatitude()))
                .thenReturn(KakaoAddressResponse.ofAddress("경기 평택시 서정동", "서정동"));
        when(locationRepository.findByUser(user)).thenReturn(Optional.empty());

        shareService.addLocation("Bearer token", request);

        verify(locationRepository).save(any());
    }

    @Test
    void hideSharePostingPersistsUserScopedHiddenPost() {
        User user = normalUser("hide-user");
        Share share = Share.builder()
                .shareId(UUID.randomUUID())
                .user(normalUser("seller"))
                .title("양파")
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();

        mockAuth(user);
        when(shareRepository.findWithUserByShareId(share.getShareId())).thenReturn(Optional.of(share));
        when(shareHiddenPostRepository.existsByUserAndShare(user, share)).thenReturn(false);

        shareService.hideSharePosting("Bearer token", share.getShareId());

        verify(shareHiddenPostRepository).save(any());
    }

    @Test
    void getHiddenShareListReturnsUserScopedHiddenPosts() {
        User user = normalUser("viewer");
        User seller = normalUser("seller");
        Share share = Share.builder()
                .shareId(UUID.randomUUID())
                .user(seller)
                .title("숨긴 양파")
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();
        ShareHiddenPost hiddenPost = ShareHiddenPost.builder()
                .user(user)
                .share(share)
                .build();
        Location sellerLocation = Location.builder().user(seller).latitude(37.0).longitude(127.0).displayAddress("서정동").build();

        mockAuth(user);
        when(shareHiddenPostRepository.findByUserOrderByCreateTimeDesc(user)).thenReturn(List.of(hiddenPost));
        when(locationRepository.findByUser(seller)).thenReturn(Optional.of(sellerLocation));

        shareService.getHiddenShareList("Bearer token");

        verify(shareConverter).toMyShareItemDTO(share, null, sellerLocation);
    }

    @Test
    void publishSharePostingSynchronizesSelectedIngredientExpirationDate() {
        User user = normalUser("giver");
        Ingredient onion = Ingredient.builder()
                .ingredientName("양파")
                .category("채소/과일")
                .build();
        UserIngredient userIngredient = UserIngredient.builder()
                .user(user)
                .ingredient(onion)
                .purchaseDate(LocalDate.of(2026, 5, 1))
                .expirationDate(LocalDate.of(2026, 5, 5))
                .status(UserIngredientStatus.NORMAL)
                .build();
        ShareRequestDTO request = ShareRequestDTO.builder()
                .title("양파 나눔")
                .ingredientName("양파")
                .content("상태 좋아요")
                .category("채소/과일")
                .expirationDate(LocalDate.of(2026, 5, 10))
                .build();
        Share share = Share.builder()
                .shareId(UUID.randomUUID())
                .user(user)
                .userIngredient(userIngredient)
                .title(request.getTitle())
                .expirationDate(request.getExpirationDate())
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();

        mockAuth(user);
        when(locationRepository.findByUser(user)).thenReturn(Optional.of(Location.builder().user(user).latitude(37.0).longitude(127.0).build()));
        when(userIngredientRepository.findByUserAndIngredient_IngredientName(user, "양파")).thenReturn(List.of(userIngredient));
        when(shareConverter.toShare(request, user, userIngredient)).thenReturn(share);

        shareService.publishSharePosting("Bearer token", request);

        assertThat(userIngredient.getExpirationDate()).isEqualTo(LocalDate.of(2026, 5, 10));
        verify(userIngredientRepository).save(userIngredient);
    }

    @Test
    void getShareListExcludesSharesHiddenByCurrentUser() {
        User user = normalUser("viewer");
        User seller = normalUser("seller");
        Share hiddenShare = Share.builder()
                .shareId(UUID.randomUUID())
                .user(seller)
                .title("숨긴 글")
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();
        Share visibleShare = Share.builder()
                .shareId(UUID.randomUUID())
                .user(seller)
                .title("보이는 글")
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();
        Location myLocation = Location.builder().user(user).latitude(37.0).longitude(127.0).fullAddress("경기 평택시 서정동").displayAddress("서정동").build();
        Location posterLocation = Location.builder().user(seller).latitude(37.001).longitude(127.001).fullAddress("경기 평택시 서정동").displayAddress("서정동").build();

        mockAuth(user);
        when(locationRepository.findByUser(user)).thenReturn(Optional.of(myLocation));
        when(shareHiddenPostRepository.findHiddenShareIdsByUser(user)).thenReturn(Set.of(hiddenShare.getShareId()));
        when(shareRepository.findVisibleSharesWithPosterLocation(user)).thenReturn(List.of(
                new Object[]{hiddenShare, posterLocation},
                new Object[]{visibleShare, posterLocation}
        ));

        shareService.getShareList("Bearer token", 10.0, 0, 10, null, null);

        verify(shareConverter, never()).toShareItemDTO(
                org.mockito.ArgumentMatchers.eq(hiddenShare),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble()
        );
        verify(shareConverter).toShareItemDTO(
                org.mockito.ArgumentMatchers.eq(visibleShare),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble()
        );
    }

    @Test
    void getShareListCanBrowseAroundExplicitCoordinatesWithoutChangingSavedLocation() {
        User user = normalUser("viewer");
        User seller = normalUser("seller");
        Share share = Share.builder()
                .shareId(UUID.randomUUID())
                .user(seller)
                .title("둘러보기 글")
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();
        Location savedLocation = Location.builder().user(user).latitude(37.0).longitude(127.0).fullAddress("경기 평택시 서정동").displayAddress("서정동").build();
        Location browsePosterLocation = Location.builder().user(seller).latitude(35.1800).longitude(129.0750).fullAddress("부산 부산진구 부전동").displayAddress("부전동").build();

        mockAuth(user);
        when(locationRepository.findByUser(user)).thenReturn(Optional.of(savedLocation));
        when(shareHiddenPostRepository.findHiddenShareIdsByUser(user)).thenReturn(Set.of());
        when(shareRepository.findVisibleSharesWithPosterLocation(user)).thenReturn(List.<Object[]>of(new Object[]{share, browsePosterLocation}));

        shareService.getShareList("Bearer token", 3.0, 0, 10, 35.1796, 129.0756);

        verify(shareConverter).toShareItemDTO(
                org.mockito.ArgumentMatchers.eq(share),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble()
        );
        verify(locationRepository, never()).save(any());
    }

    private User normalUser(String userId) {
        return User.builder()
                .userId(userId)
                .nickName(userId)
                .firstLogin(false)
                .status(UserStatus.NORMAL)
                .role(Role.USER)
                .build();
    }

    private void mockAuth(User user) {
        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getSubject("token")).thenReturn(user.getUserId());
        when(userRepository.findByUserIdIsAndDeletedAtIsNull(user.getUserId())).thenReturn(Optional.of(user));
    }
}
