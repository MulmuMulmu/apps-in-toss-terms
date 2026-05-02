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
import com.team200.graduation_project.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ShareConverter {

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

    public ShareListResponseDTO.ShareItemDTO toShareItemDTO(Share share, Double distance, String imageUrl, String displayAddress) {
        return ShareListResponseDTO.ShareItemDTO.builder()
                .postId(share.getShareId())
                .title(share.getTitle())
                .locationName(displayAddress)
                .distance(distance)
                .image(imageUrl)
                .createdAt(share.getCreateTime())
                .build();
    }

    public ShareDetailResponseDTO toShareDetailResponse(Share share, SharePicture picture) {
        return ShareDetailResponseDTO.builder()
                .image(picture != null ? picture.getPictureUrl() : null)
                .sellerName(share.getUser().getNickName())
                .title(share.getTitle())
                .category(share.getCategory())
                .content(share.getContent())
                .expirationDate(share.getExpirationDate())
                .createTime(share.getCreateTime())
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

    public MyShareItemDTO toMyShareItemDTO(Share share, String imageUrl) {
        return MyShareItemDTO.builder()
                .postId(share.getShareId())
                .image(imageUrl)
                .title(share.getTitle())
                .content(share.getContent())
                .build();
    }
}
