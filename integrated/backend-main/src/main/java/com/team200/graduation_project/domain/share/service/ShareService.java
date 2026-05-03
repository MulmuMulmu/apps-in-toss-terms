package com.team200.graduation_project.domain.share.service;

import com.team200.graduation_project.domain.share.client.KakaoLocalClient;
import com.team200.graduation_project.domain.share.converter.ShareConverter;
import com.team200.graduation_project.domain.share.dto.external.KakaoAddressResponse;
import com.team200.graduation_project.domain.share.dto.external.KakaoAddressSearchResponse;
import com.team200.graduation_project.domain.share.dto.request.LocationRequest;
import com.team200.graduation_project.domain.share.dto.request.ReportRequestDTO;
import com.team200.graduation_project.domain.share.dto.request.ShareRequestDTO;
import com.team200.graduation_project.domain.share.dto.request.ShareSuccessionRequestDTO;
import com.team200.graduation_project.domain.share.dto.response.LocationResponse;
import com.team200.graduation_project.domain.share.dto.response.LocationSearchResponse;
import com.team200.graduation_project.domain.share.dto.response.MyShareItemDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareDetailResponseDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareListResponseDTO;
import com.team200.graduation_project.domain.share.entity.ChatRoom;
import com.team200.graduation_project.domain.share.entity.Report;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.ShareHiddenPost;
import com.team200.graduation_project.domain.share.entity.SharePicture;
import com.team200.graduation_project.domain.share.entity.ShareStatus;
import com.team200.graduation_project.domain.share.exception.ShareErrorCode;
import com.team200.graduation_project.domain.share.exception.ShareException;
import com.team200.graduation_project.domain.share.policy.ShareEligibilityPolicy;
import com.team200.graduation_project.domain.share.repository.ReportRepository;
import com.team200.graduation_project.domain.share.repository.ShareHiddenPostRepository;
import com.team200.graduation_project.domain.share.repository.SharePictureRepository;
import com.team200.graduation_project.domain.share.repository.ChatRoomRepository;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.ingredient.repository.UserIngredientRepository;
import com.team200.graduation_project.domain.share.repository.ShareRepository;
import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.repository.LocationRepository;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ShareService {

    private static final double DEFAULT_RADIUS_KM = 10.0;
    private static final double MIN_RADIUS_KM = 1.0;
    private static final double MAX_RADIUS_KM = 50.0;
    private static final double DEFAULT_LOCATION_VERIFICATION_RADIUS_KM = 3.0;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;

    private final KakaoLocalClient kakaoLocalClient;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final ShareRepository shareRepository;
    private final SharePictureRepository sharePictureRepository;
    private final ShareHiddenPostRepository shareHiddenPostRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ReportRepository reportRepository;
    private final UserIngredientRepository userIngredientRepository;
    private final ShareConverter shareConverter;
    private final ShareEligibilityPolicy shareEligibilityPolicy;
    private final Storage storage;

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    @Value("${app.location.verification-radius-km:" + DEFAULT_LOCATION_VERIFICATION_RADIUS_KM + "}")
    private double locationVerificationRadiusKm;

    @Transactional(readOnly = true)
    public List<LocationSearchResponse> searchLocations(String query) {
        if (!StringUtils.hasText(query) || query.trim().length() < 2) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        KakaoAddressSearchResponse response = kakaoLocalClient.searchAddress(query.trim());
        if (response == null || response.getDocuments() == null) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }

        return response.getDocuments().stream()
                .map(this::toLocationSearchResponse)
                .filter(java.util.Objects::nonNull)
                .limit(10)
                .toList();
    }

    @Transactional
    public LocationResponse addLocation(String authorizationHeader, LocationRequest request) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        String userId = jwtTokenProvider.getSubject(token);
        User user = userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.UNAUTHORIZED));

        validateLocationRequest(request);
        validateLocationVerification(request);

        KakaoAddressResponse response = kakaoLocalClient.coord2address(request.getLongitude(), request.getLatitude());

        if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }

        KakaoAddressResponse.Document document = response.getDocuments().get(0);

        String fullAddress = "";
        String displayAddress = "";

        if (document.getAddress() != null) {
            fullAddress = document.getAddress().getAddressName();
            displayAddress = document.getAddress().getRegion3DepthName();
        } else if (document.getRoadAddress() != null) {
            fullAddress = document.getRoadAddress().getAddressName();
            displayAddress = document.getRoadAddress().getRegion3DepthName();
        }

        if (fullAddress.isEmpty()) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }

        Location location = locationRepository.findByUser(user).orElse(null);
        if (location == null) {
            location = Location.builder()
                    .user(user)
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .fullAddress(fullAddress)
                    .displayAddress(displayAddress)
                    .build();
        } else {
            location.update(request.getLatitude(), request.getLongitude(), fullAddress, displayAddress);
        }
        locationRepository.save(location);

        return LocationResponse.builder()
                .full_address(fullAddress)
                .display_address(displayAddress)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
    }

    private void validateLocationRequest(LocationRequest request) {
        if (request == null
                || request.getLatitude() == null
                || request.getLongitude() == null
                || request.getLatitude().isNaN()
                || request.getLatitude().isInfinite()
                || request.getLongitude().isNaN()
                || request.getLongitude().isInfinite()
                || request.getLatitude() < -90
                || request.getLatitude() > 90
                || request.getLongitude() < -180
                || request.getLongitude() > 180) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
    }

    private void validateLocationVerification(LocationRequest request) {
        boolean hasVerificationLatitude = request.getVerificationLatitude() != null;
        boolean hasVerificationLongitude = request.getVerificationLongitude() != null;
        if (!hasVerificationLatitude || !hasVerificationLongitude) {
            throw new GeneralException(GeneralErrorCode.LOCATION_VERIFICATION_FAILED);
        }
        if (request.getVerificationLatitude().isNaN()
                || request.getVerificationLatitude().isInfinite()
                || request.getVerificationLongitude().isNaN()
                || request.getVerificationLongitude().isInfinite()) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        double distance = calculateDistance(
                request.getLatitude(),
                request.getLongitude(),
                request.getVerificationLatitude(),
                request.getVerificationLongitude()
        );
        if (distance > locationVerificationRadiusKm) {
            throw new GeneralException(GeneralErrorCode.LOCATION_VERIFICATION_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public LocationResponse getMyLocation(String authorizationHeader) {
        User user = findUserFromHeader(authorizationHeader);
        Location location = locationRepository.findByUser(user)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.LOCATION_NOT_FOUND));

        return LocationResponse.builder()
                .full_address(normalizeStoredFullAddress(location.getFullAddress()))
                .display_address(normalizeStoredDisplayAddress(location.getDisplayAddress()))
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .build();
    }

    private LocationSearchResponse toLocationSearchResponse(KakaoAddressSearchResponse.Document document) {
        if (document == null || !StringUtils.hasText(document.getX()) || !StringUtils.hasText(document.getY())) {
            return null;
        }

        try {
            String displayAddress = document.getAddressName();
            if (document.getAddress() != null) {
                if (StringUtils.hasText(document.getAddress().getRegion3DepthHName())) {
                    displayAddress = document.getAddress().getRegion3DepthHName();
                } else if (StringUtils.hasText(document.getAddress().getRegion3DepthName())) {
                    displayAddress = document.getAddress().getRegion3DepthName();
                }
            }

            return LocationSearchResponse.builder()
                    .full_address(document.getAddressName())
                    .display_address(displayAddress)
                    .longitude(Double.parseDouble(document.getX()))
                    .latitude(Double.parseDouble(document.getY()))
                    .build();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional
    public void publishSharePosting(String authorizationHeader, ShareRequestDTO request) {
        User user = findUserFromHeader(authorizationHeader);
        locationRepository.findByUser(user)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.LOCATION_NOT_FOUND));

        UserIngredient userIngredient = null;
        if (StringUtils.hasText(request.getIngredientName())) {
            List<UserIngredient> matchingIngredients = userIngredientRepository.findByUserAndIngredient_IngredientName(user, request.getIngredientName());
            
            userIngredient = matchingIngredients.stream()
                    .filter(i -> i.getExpirationDate() != null)
                    .min(Comparator.comparing(UserIngredient::getExpirationDate))
                    .orElseGet(() -> matchingIngredients.stream().findFirst().orElse(null));

            if (userIngredient == null) {
                throw new ShareException(ShareErrorCode.USER_INGREDIENT_NOT_FOUND);
            }
        } else {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        synchronizeIngredientExpirationDate(userIngredient, request);
        validateShareEligibility(userIngredient, request);

        try {
            Share share = shareConverter.toShare(request, user, userIngredient);
            shareRepository.save(share);

            if (request.getImage() != null && !request.getImage().isEmpty()) {
                String url = uploadToGcp(request.getImage(), user.getUserId());
                SharePicture picture = shareConverter.toSharePicture(url, share);
                sharePictureRepository.save(picture);
            }
        } catch (ShareException e) {
            throw e;
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_FAILED);
        }
    }

    private User findUserFromHeader(String authorizationHeader) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        String userId = jwtTokenProvider.getSubject(token);
        return userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.UNAUTHORIZED));
    }

    private String uploadToGcp(MultipartFile file, String userId) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String date = LocalDate.now().toString();
        String fileName = String.format("share/%s/%s/%s_%s", userId, date, uuid, file.getOriginalFilename());
        String contentType = file.getContentType();

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(contentType)
                .build();

        storage.create(blobInfo, file.getBytes());

        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }

    @Transactional(readOnly = true)
    public ShareListResponseDTO getShareList(String authorizationHeader, Double radiusKm, Integer page, Integer size) {
        return getShareList(authorizationHeader, radiusKm, page, size, null, null);
    }

    @Transactional(readOnly = true)
    public ShareListResponseDTO getShareList(String authorizationHeader, Double radiusKm, Integer page, Integer size, Double latitude, Double longitude) {
        User currentUser = findUserFromHeader(authorizationHeader);
        Location currentUserLocation = locationRepository.findByUser(currentUser)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.LOCATION_NOT_FOUND));
        double searchRadiusKm = normalizeRadiusKm(radiusKm);
        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizePageSize(size);

        double myLat = latitude != null ? latitude : currentUserLocation.getLatitude();
        double myLon = longitude != null ? longitude : currentUserLocation.getLongitude();
        validateBrowseCoordinates(myLat, myLon);
        Set<UUID> hiddenShareIds = shareHiddenPostRepository.findHiddenShareIdsByUser(currentUser);

        List<ShareWithDistance> filteredShares = shareRepository.findVisibleSharesWithPosterLocation(currentUser).stream()
                .map(row -> {
                    Share share = (Share) row[0];
                    if (hiddenShareIds.contains(share.getShareId())) return null;
                    Location posterLocation = (Location) row[1];
                    double distance = calculateDistance(myLat, myLon, posterLocation.getLatitude(), posterLocation.getLongitude());
                    if (distance > searchRadiusKm) return null;
                    return new ShareWithDistance(share, posterLocation, distance, normalizeStoredDisplayAddress(posterLocation.getDisplayAddress()));
                })
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(
                        (ShareWithDistance item) -> item.share.getCreateTime(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).reversed())
                .toList();

        long totalCount = filteredShares.size();

        List<ShareListResponseDTO.ShareItemDTO> itemDTOs = filteredShares.stream()
                .skip((long) normalizedPage * normalizedSize)
                .limit(normalizedSize)
                .map(swd -> {
                    String firstImageUrl = swd.share.getSharePicture() != null 
                            ? swd.share.getSharePicture().getPictureUrl() 
                            : null;
                    
                    return shareConverter.toShareItemDTO(
                            swd.share,
                            swd.distance,
                            firstImageUrl,
                            swd.displayAddress,
                            swd.posterLocation.getLatitude(),
                            swd.posterLocation.getLongitude()
                    );
                })
                .toList();

        return shareConverter.toShareListResponse(
                itemDTOs,
                totalCount,
                normalizedPage,
                normalizedSize,
                ((long) (normalizedPage + 1) * normalizedSize) < totalCount
        );
    }

    @Transactional
    public void hideSharePosting(String authorizationHeader, UUID postId) {
        User user = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findWithUserByShareId(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));
        if (!shareHiddenPostRepository.existsByUserAndShare(user, share)) {
            shareHiddenPostRepository.save(ShareHiddenPost.builder()
                    .user(user)
                    .share(share)
                    .build());
        }
    }

    @Transactional
    public void unhideSharePosting(String authorizationHeader, UUID postId) {
        User user = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findWithUserByShareId(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));
        shareHiddenPostRepository.deleteByUserAndShare(user, share);
    }

    @Transactional(readOnly = true)
    public List<MyShareItemDTO> getHiddenShareList(String authorizationHeader) {
        User user = findUserFromHeader(authorizationHeader);
        return shareHiddenPostRepository.findByUserOrderByCreateTimeDesc(user).stream()
                .map(ShareHiddenPost::getShare)
                .filter(share -> share != null
                        && share.getDeletedAt() == null
                        && Boolean.TRUE.equals(share.getIsView())
                        && share.getStatus() == ShareStatus.AVAILABLE)
                .map(share -> {
                    String imageUrl = share.getSharePicture() != null
                            ? share.getSharePicture().getPictureUrl()
                            : null;
                    Location posterLocation = share.getUser() == null
                            ? null
                            : locationRepository.findByUser(share.getUser()).orElse(null);
                    return shareConverter.toMyShareItemDTO(share, imageUrl, posterLocation);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ShareDetailResponseDTO getShareDetail(String authorizationHeader, UUID postId) {
        User currentUser = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findWithUserByShareId(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));
        boolean owner = share.getUser() != null && share.getUser().getUserId().equals(currentUser.getUserId());
        if (!owner && (!Boolean.TRUE.equals(share.getIsView()) || share.getStatus() != ShareStatus.AVAILABLE)) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND);
        }

        Location posterLocation = share.getUser() == null ? null : locationRepository.findByUser(share.getUser()).orElse(null);
        return shareConverter.toShareDetailResponse(share, share.getSharePicture(), posterLocation);
    }

    @Transactional(readOnly = true)
    public List<MyShareItemDTO> getMyShareList(String authorizationHeader, String type) {
        User user = findUserFromHeader(authorizationHeader);

        ShareStatus status = ShareStatus.AVAILABLE;
        if ("나눔 완료".equals(type)) {
            status = ShareStatus.COMPLETED;
        } else if ("나눔 중".equals(type)) {
            status = ShareStatus.AVAILABLE;
        }

        try {
            List<Share> myShares = shareRepository.findAllByUserAndStatusOrderByCreateTimeDesc(user, status);
            Location posterLocation = locationRepository.findByUser(user).orElse(null);

            return myShares.stream()
                    .map(share -> {
                        String imageUrl = share.getSharePicture() != null 
                                ? share.getSharePicture().getPictureUrl() 
                                : null;
                        return shareConverter.toMyShareItemDTO(share, imageUrl, posterLocation);
                    })
                    .toList();
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.MY_SHARE_LIST_FETCH_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public List<MyShareItemDTO> getUserShareList(String authorizationHeader, String sellerId) {
        findUserFromHeader(authorizationHeader);
        User seller = userRepository.findByUserIdIsAndDeletedAtIsNull(sellerId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));
        Location posterLocation = locationRepository.findByUser(seller).orElse(null);

        return shareRepository.findAllByUserAndStatusOrderByCreateTimeDesc(seller, ShareStatus.AVAILABLE).stream()
                .filter(share -> Boolean.TRUE.equals(share.getIsView()))
                .map(share -> {
                    String firstImageUrl = share.getSharePicture() != null
                            ? share.getSharePicture().getPictureUrl()
                            : null;
                    return shareConverter.toMyShareItemDTO(share, firstImageUrl, posterLocation);
                })
                .toList();
    }

    @Transactional
    public void updateMySharePosting(String authorizationHeader, UUID postId, ShareRequestDTO request) {
        User user = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findById(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));

        if (!share.getUser().getUserId().equals(user.getUserId())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        if (share.getDeletedAt() != null || !Boolean.TRUE.equals(share.getIsView()) || share.getStatus() != ShareStatus.AVAILABLE) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        UserIngredient userIngredient = share.getUserIngredient();
        if (StringUtils.hasText(request.getIngredientName())) {
            List<UserIngredient> matchingIngredients = userIngredientRepository.findByUserAndIngredient_IngredientName(user, request.getIngredientName());

            userIngredient = matchingIngredients.stream()
                    .filter(i -> i.getExpirationDate() != null)
                    .min(Comparator.comparing(UserIngredient::getExpirationDate))
                    .orElseGet(() -> matchingIngredients.stream().findFirst().orElse(null));

            if (userIngredient == null) {
                throw new ShareException(ShareErrorCode.USER_INGREDIENT_NOT_FOUND);
            }
        }

        synchronizeIngredientExpirationDate(userIngredient, request);
        validateShareEligibility(userIngredient, request);

        try {
            share.update(request.getTitle(), request.getContent(), request.getCategory(), request.getExpirationDate(), userIngredient);
            shareRepository.save(share);

            if (request.getImage() != null && !request.getImage().isEmpty()) {
                String imageUrl = uploadToGcp(request.getImage(), user.getUserId());
                if (share.getSharePicture() != null) {
                    share.getSharePicture().updateUrl(imageUrl);
                } else {
                    SharePicture newPicture = shareConverter.toSharePicture(imageUrl, share);
                    sharePictureRepository.save(newPicture);
                }
            }
        } catch (ShareException e) {
            throw e;
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_FAILED);
        }
    }

    @Transactional
    public void deleteMySharePosting(String authorizationHeader, UUID postId) {
        User user = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findById(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));

        if (!share.getUser().getUserId().equals(user.getUserId())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        if (share.getDeletedAt() != null || !Boolean.TRUE.equals(share.getIsView()) || share.getStatus() != ShareStatus.AVAILABLE) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        try {
            share.softDelete();
            shareRepository.save(share);
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_FAILED);
        }
    }

    @Transactional
    public void reportSharePosting(String authorizationHeader, UUID postId, ReportRequestDTO request) {
        User reporter = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findById(postId)
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));
        if (share.getUser() == null || share.getUser().getUserId().equals(reporter.getUserId())) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }
        if (share.getDeletedAt() != null || !Boolean.TRUE.equals(share.getIsView()) || share.getStatus() != ShareStatus.AVAILABLE) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        try {
            Report report = shareConverter.toReport(request, reporter, share);
            reportRepository.save(report);
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_FAILED);
        }
    }

    @Transactional
    public void completeShareSuccession(String authorizationHeader, ShareSuccessionRequestDTO request) {
        if (request == null || request.getPostId() == null || request.getChatRoomId() == null) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        User giver = findUserFromHeader(authorizationHeader);
        Share share = shareRepository.findByIdForUpdate(request.getPostId())
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));

        if (!share.getUser().getUserId().equals(giver.getUserId())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        if (share.getStatus() != ShareStatus.AVAILABLE || share.getDeletedAt() != null || !Boolean.TRUE.equals(share.getIsView())) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        User taker = resolveSuccessionTaker(request, share, giver);

        UserIngredient giverIngredient = share.getUserIngredient();
        if (giverIngredient == null) {
            throw new ShareException(ShareErrorCode.USER_INGREDIENT_NOT_FOUND);
        }
        if (giverIngredient.getUser() == null || !giverIngredient.getUser().getUserId().equals(giver.getUserId())) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }

        try {
            if (!"전체".equals(request.getType())) {
                throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
            }

            giverIngredient.updateUser(taker);
            userIngredientRepository.save(giverIngredient);
            share.setStatus(ShareStatus.COMPLETED);
            shareRepository.save(share);
        } catch (ShareException e) {
            throw e;
        } catch (Exception e) {
            throw new ShareException(ShareErrorCode.SHARE_POSTING_FAILED);
        }
    }

    private User resolveSuccessionTaker(ShareSuccessionRequestDTO request, Share share, User giver) {
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_BAD_REQUEST));
        if (chatRoom.getShare() == null || !chatRoom.getShare().getShareId().equals(share.getShareId())) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }
        User taker = chatRoom.getSender();

        if (taker == null || giver.getUserId().equals(taker.getUserId())) {
            throw new ShareException(ShareErrorCode.SHARE_BAD_REQUEST);
        }
        return taker;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    private double normalizeRadiusKm(Double radiusKm) {
        if (radiusKm == null || radiusKm.isNaN() || radiusKm.isInfinite()) {
            return DEFAULT_RADIUS_KM;
        }
        return Math.max(MIN_RADIUS_KM, Math.min(MAX_RADIUS_KM, radiusKm));
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private int normalizePageSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private void validateBrowseCoordinates(double latitude, double longitude) {
        if (Double.isNaN(latitude)
                || Double.isInfinite(latitude)
                || Double.isNaN(longitude)
                || Double.isInfinite(longitude)
                || latitude < -90
                || latitude > 90
                || longitude < -180
                || longitude > 180) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
    }

    private String normalizeStoredFullAddress(String fullAddress) {
        if (!StringUtils.hasText(fullAddress) || fullAddress.contains("로컬")) {
            return "";
        }
        return fullAddress;
    }

    private String normalizeStoredDisplayAddress(String displayAddress) {
        if (!StringUtils.hasText(displayAddress) || displayAddress.contains("로컬")) {
            return "";
        }
        return displayAddress;
    }

    private void validateShareEligibility(UserIngredient userIngredient, ShareRequestDTO request) {
        String reason = shareEligibilityPolicy.violationReason(
                userIngredient,
                request.getCategory(),
                request.getTitle(),
                request.getContent()
        );
        if (reason != null) {
            throw new ShareException(ShareErrorCode.SHARE_ITEM_NOT_ALLOWED);
        }
    }

    private void synchronizeIngredientExpirationDate(UserIngredient userIngredient, ShareRequestDTO request) {
        if (userIngredient == null || request == null || request.getExpirationDate() == null) {
            return;
        }
        if (!request.getExpirationDate().equals(userIngredient.getExpirationDate())) {
            userIngredient.updateOwnedIngredient(
                    userIngredient.getIngredient(),
                    userIngredient.getPurchaseDate(),
                    request.getExpirationDate(),
                    userIngredient.getStatus()
            );
            userIngredientRepository.save(userIngredient);
        }
    }

    private static class ShareWithDistance {
        Share share;
        Location posterLocation;
        double distance;
        String displayAddress;

        ShareWithDistance(Share share, Location posterLocation, double distance, String displayAddress) {
            this.share = share;
            this.posterLocation = posterLocation;
            this.distance = distance;
            this.displayAddress = displayAddress;
        }
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
