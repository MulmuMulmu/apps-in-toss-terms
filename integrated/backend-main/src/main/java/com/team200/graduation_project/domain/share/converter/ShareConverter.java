package com.team200.graduation_project.domain.share.converter;

import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.share.dto.request.ReportRequestDTO;
import com.team200.graduation_project.domain.share.dto.request.ShareRequestDTO;
import com.team200.graduation_project.domain.share.dto.response.MyShareItemDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareDetailResponseDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareListResponseDTO;
import com.team200.graduation_project.domain.share.entity.Report;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.entity.SharePicture;
import com.team200.graduation_project.domain.share.entity.ShareStatus;
import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ShareConverter {

    private static final String DEFAULT_PROFILE_IMAGE_URL = "https://storage.googleapis.com/mulmumulmu_picture/profilePicture/%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%86%E1%85%AE%E1%86%AF%E1%84%86%E1%85%AE%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%89%E1%85%A1%E1%84%8C%E1%85%B5%E1%86%AB.png";

    public Share toShare(ShareRequestDTO request, User user, UserIngredient userIngredient) {
        return Share.builder()
                .user(user)
                .userIngredient(userIngredient)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .expirationDate(request.getExpirationDate())
                .status(ShareStatus.AVAILABLE)
                .isView(true)
                .build();
    }

    public SharePicture toSharePicture(String pictureUrl, Share share) {
        return SharePicture.builder()
                .share(share)
                .pictureUrl(pictureUrl)
                .build();
    }

    public ShareListResponseDTO toShareListResponse(
            List<ShareListResponseDTO.ShareItemDTO> items,
            Long totalCount,
            Integer page,
            Integer size,
            Boolean hasNext
    ) {
        return ShareListResponseDTO.builder()
                .items(items)
                .totalCount(totalCount)
                .page(page)
                .size(size)
                .hasNext(hasNext)
                .build();
    }

    public ShareListResponseDTO.ShareItemDTO toShareItemDTO(Share share, Double distance, String imageUrl, String displayAddress, Double latitude, Double longitude) {
        String ingredientName = share.getUserIngredient() != null && share.getUserIngredient().getIngredient() != null
                ? share.getUserIngredient().getIngredient().getIngredientName()
                : null;
        return ShareListResponseDTO.ShareItemDTO.builder()
                .postId(share.getShareId())
                .sellerId(share.getUser() != null ? share.getUser().getUserId() : null)
                .sellerName(share.getUser() != null ? share.getUser().getNickName() : null)
                .sellerProfileImageUrl(resolveProfileImageUrl(share.getUser()))
                .title(share.getTitle())
                .ingredientName(ingredientName)
                .category(share.getCategory())
                .expirationDate(share.getExpirationDate())
                .locationName(displayAddress)
                .distance(distance)
                .latitude(latitude)
                .longitude(longitude)
                .image(imageUrl)
                .createdAt(share.getCreateTime())
                .build();
    }

    public ShareDetailResponseDTO toShareDetailResponse(Share share, SharePicture picture, Location location) {
        String ingredientName = share.getUserIngredient() != null && share.getUserIngredient().getIngredient() != null
                ? share.getUserIngredient().getIngredient().getIngredientName()
                : null;
        return ShareDetailResponseDTO.builder()
                .image(picture != null ? picture.getPictureUrl() : null)
                .sellerId(share.getUser().getUserId())
                .sellerName(share.getUser().getNickName())
                .sellerProfileImageUrl(resolveProfileImageUrl(share.getUser()))
                .title(share.getTitle())
                .ingredientName(ingredientName)
                .category(share.getCategory())
                .content(share.getContent())
                .expirationDate(share.getExpirationDate())
                .createTime(share.getCreateTime())
                .locationName(location != null ? normalizeLocationName(location) : null)
                .latitude(location != null ? location.getLatitude() : null)
                .longitude(location != null ? location.getLongitude() : null)
                .build();
    }

    public Report toReport(ReportRequestDTO request, User reporter, Share share) {
        return Report.builder()
                .reporter(reporter)
                .share(share)
                .title(request.getTitle())
                .content(request.getContent())
                .build();
    }

    public MyShareItemDTO toMyShareItemDTO(Share share, String imageUrl, Location location) {
        String ingredientName = share.getUserIngredient() != null && share.getUserIngredient().getIngredient() != null
                ? share.getUserIngredient().getIngredient().getIngredientName()
                : null;
        return MyShareItemDTO.builder()
                .postId(share.getShareId())
                .image(imageUrl)
                .title(share.getTitle())
                .ingredientName(ingredientName)
                .category(share.getCategory())
                .content(share.getContent())
                .expirationDate(share.getExpirationDate())
                .locationName(location != null ? normalizeLocationName(location) : null)
                .latitude(location != null ? location.getLatitude() : null)
                .longitude(location != null ? location.getLongitude() : null)
                .build();
    }

    private String normalizeLocationName(Location location) {
        if (location == null) {
            return null;
        }
        if (location.getDisplayAddress() != null && !location.getDisplayAddress().isBlank() && !location.getDisplayAddress().contains("로컬")) {
            return location.getDisplayAddress();
        }
        if (location.getFullAddress() != null && !location.getFullAddress().isBlank() && !location.getFullAddress().contains("로컬")) {
            return location.getFullAddress();
        }
        return null;
    }

    private String resolveProfileImageUrl(User user) {
        if (user != null && user.getImageUrl() != null && !user.getImageUrl().isBlank()) {
            return user.getImageUrl();
        }
        return DEFAULT_PROFILE_IMAGE_URL;
    }
}
