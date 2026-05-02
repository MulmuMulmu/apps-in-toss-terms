package com.team200.graduation_project.domain.share.controller;

import com.team200.graduation_project.domain.share.dto.request.LocationRequest;
import com.team200.graduation_project.domain.share.dto.request.ReportRequestDTO;
import com.team200.graduation_project.domain.share.dto.request.ShareRequestDTO;
import com.team200.graduation_project.domain.share.dto.request.ShareSuccessionRequestDTO;
import com.team200.graduation_project.domain.share.dto.response.LocationResponse;
import com.team200.graduation_project.domain.share.dto.response.LocationSearchResponse;
import com.team200.graduation_project.domain.share.dto.response.MyShareItemDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareDetailResponseDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareListResponseDTO;
import com.team200.graduation_project.domain.share.service.ShareService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/share")
@RequiredArgsConstructor
public class ShareController implements ShareControllerDocs {

    private final ShareService shareService;

    @Override
    @PostMapping({"/location", "/adding/location/gps", "/adding/location/kakao"})
    public ApiResponse<LocationResponse> addLocation(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody LocationRequest request
    ) {
        return ApiResponse.onSuccess(shareService.addLocation(authorizationHeader, request));
    }

    @Override
    @GetMapping("/location/search")
    public ApiResponse<List<LocationSearchResponse>> searchLocations(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam String query
    ) {
        return ApiResponse.onSuccess(shareService.searchLocations(query));
    }

    @Override
    @GetMapping("/location/me")
    public ApiResponse<LocationResponse> getMyLocation(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader
    ) {
        return ApiResponse.onSuccess(shareService.getMyLocation(authorizationHeader));
    }

    @Override
    @PostMapping(value = "/posting", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> publishSharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @ModelAttribute ShareRequestDTO request
    ) {
        shareService.publishSharePosting(authorizationHeader, request);
        return ApiResponse.onSuccess("성공적으로 등록되었습니다.");
    }

    @Override
    @GetMapping({"/list", "/posting/list"})
    public ApiResponse<ShareListResponseDTO> getShareList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam(defaultValue = "10") Double radiusKm,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        return ApiResponse.onSuccess(shareService.getShareList(authorizationHeader, radiusKm, page, size));
    }

    @Override
    @GetMapping({"/list/one", "/posting/list/one"})
    public ApiResponse<ShareDetailResponseDTO> getShareDetail(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID postId
    ) {
        return ApiResponse.onSuccess(shareService.getShareDetail(postId));
    }

    @Override
    @GetMapping({"/list/my", "/posting/list/my"})
    public ApiResponse<List<MyShareItemDTO>> getMyShareList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam String type
    ) {
        return ApiResponse.onSuccess(shareService.getMyShareList(authorizationHeader, type));
    }

    @Override
    @PutMapping(value = {"/list/my", "/posting/list/my"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> updateMySharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID postId,
            @ModelAttribute ShareRequestDTO request
    ) {
        shareService.updateMySharePosting(authorizationHeader, postId, request);
        return ApiResponse.onSuccess("수정 완료되었습니다.");
    }

    @Override
    @DeleteMapping({"/list/my", "/posting/list/my"})
    public ApiResponse<String> deleteMySharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID postId
    ) {
        shareService.deleteMySharePosting(authorizationHeader, postId);
        return ApiResponse.onSuccess("나눔글이 삭제되었습니다.");
    }

    @Override
    @PostMapping("/report")
    public ApiResponse<String> reportSharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID postId,
            @RequestBody ReportRequestDTO request
    ) {
        shareService.reportSharePosting(authorizationHeader, postId, request);
        return ApiResponse.onSuccess("신고가 완료되었습니다.");
    }

    @Override
    @PostMapping("/posting/succession")
    public ApiResponse<String> completeShareSuccession(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ShareSuccessionRequestDTO request
    ) {
        shareService.completeShareSuccession(authorizationHeader, request);
        return ApiResponse.onSuccess("나눔 완료되었습니다.");
    }
}
