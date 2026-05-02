package com.team200.graduation_project.domain.admin.controller;

import com.team200.graduation_project.domain.admin.dto.request.AdminIngredientRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminIngredientAliasRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminLoginRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminOcrAccuracyRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminOcrIngredientUpdateRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminUserActionRequest;
import com.team200.graduation_project.domain.admin.dto.response.AdminLoginResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminReportDetailResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminReportListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminShareDetailResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminDataStatisticsResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminOcrDetailResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminOcrIngredientResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminOcrListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserShareListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminTodayReportResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminTodayShareResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserDashboardResponse;
import com.team200.graduation_project.domain.admin.service.AdminService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController implements AdminControllerDocs {

    private final AdminService adminService;

    @Override
    @PostMapping("/ingredient/input")
    public ApiResponse<String> addIngredients(@RequestBody List<AdminIngredientRequest> requests) {
        try {
            adminService.addIngredients(requests);
            return ApiResponse.onSuccess("식재료가 성공적으로 등록되었습니다.");
        } catch (Exception e) {
            return ApiResponse.onFailure("COMMON500", "식재료를 등록할 수 없습니다.");
        }
    }

    @Override
    @PostMapping("/auth/login")
    public ApiResponse<AdminLoginResponse> login(@RequestBody AdminLoginRequest request) {
        return ApiResponse.onSuccess(adminService.login(request));
    }

    @Override
    @PostMapping("/auth/logout")
    public ApiResponse<String> logout() {
        return ApiResponse.onSuccess(adminService.logout());
    }

    @Override
    @GetMapping("/dashboard/user")
    public ApiResponse<AdminUserDashboardResponse> getUserDashboard() {
        return ApiResponse.onSuccess(adminService.getUserDashboard());
    }

    @Override
    @GetMapping("/dashboard/today/report")
    public ApiResponse<AdminTodayReportResponse> getTodayReports() {
        return ApiResponse.onSuccess(adminService.getTodayReports());
    }

    @Override
    @GetMapping("/dashboard/today/share")
    public ApiResponse<AdminTodayShareResponse> getTodayShares() {
        return ApiResponse.onSuccess(adminService.getTodayShares());
    }

    @Override
    @GetMapping("/report/list")
    public ApiResponse<AdminReportListResponse> getReportList(
            @RequestParam("Date") LocalDate date,
            @RequestParam("type") String type
    ) {
        return ApiResponse.onSuccess(adminService.getReportList(date, type));
    }

    @Override
    @GetMapping("/report/one")
    public ApiResponse<AdminReportDetailResponse> getReportDetail(
            @RequestParam("reportId") UUID reportId
    ) {
        return ApiResponse.onSuccess(adminService.getReportDetail(reportId));
    }

    @Override
    @PatchMapping("/report/post/masking")
    public ApiResponse<String> maskSharePost(
            @RequestParam("shareId") UUID shareId
    ) {
        adminService.maskSharePost(shareId);
        return ApiResponse.onSuccess("게시글이 숨김 처리 되었습니다.");
    }

    @Override
    @PatchMapping("/report/users")
    public ApiResponse<String> takeActionAgainstUser(
            @RequestBody AdminUserActionRequest request
    ) {
        return ApiResponse.onSuccess(adminService.takeActionAgainstUser(request));
    }

    @Override
    @GetMapping("/shares/one")
    public ApiResponse<AdminShareDetailResponse> getShareDetail(
            @RequestParam("shareId") UUID shareId
    ) {
        return ApiResponse.onSuccess(adminService.getShareDetail(shareId));
    }

    @Override
    @GetMapping("/users/list")
    public ApiResponse<List<AdminUserListResponse>> getUserList(
            @RequestParam("userId") String userId
    ) {
        return ApiResponse.onSuccess(adminService.getUserList(userId));
    }

    @Override
    @GetMapping("/users/shares/list")
    public ApiResponse<List<AdminUserShareListResponse>> getUserShareList(
            @RequestParam("userId") String userId
    ) {
        return ApiResponse.onSuccess(adminService.getUserShareList(userId));
    }

    @Override
    @GetMapping("/ocr/list")
    public ApiResponse<List<AdminOcrListResponse>> getOcrList() {
        return ApiResponse.onSuccess(adminService.getOcrList());
    }

    @Override
    @GetMapping("/ocr/one")
    public ApiResponse<AdminOcrDetailResponse> getOcrDetail(
            @RequestParam("ocrId") UUID ocrId
    ) {
        return ApiResponse.onSuccess(adminService.getOcrDetail(ocrId));
    }

    @Override
    @GetMapping("/ocr/one/ingredients")
    public ApiResponse<List<AdminOcrIngredientResponse>> getOcrIngredients(
            @RequestParam("ocrId") UUID ocrId
    ) {
        return ApiResponse.onSuccess(adminService.getOcrIngredients(ocrId));
    }

    @Override
    @PostMapping("/ocr/accuracy")
    public ApiResponse<String> updateOcrAccuracy(
            @RequestBody AdminOcrAccuracyRequest request
    ) {
        return ApiResponse.onSuccess(adminService.updateOcrAccuracy(request));
    }

    @Override
    @PostMapping("/ingredient/alias")
    public ApiResponse<String> addIngredientAlias(@RequestBody AdminIngredientAliasRequest request) {
        return ApiResponse.onSuccess(adminService.addIngredientAlias(request));
    }

    @Override
    @PatchMapping("/ocr/ingredients")
    public ApiResponse<String> updateOcrIngredients(
            @RequestBody AdminOcrIngredientUpdateRequest request
    ) {
        return ApiResponse.onSuccess(adminService.updateOcrIngredients(request));
    }

    @Override
    @GetMapping("/data/statistics")
    public ApiResponse<List<AdminDataStatisticsResponse>> getDataStatistics(
            @RequestParam("startDate") LocalDate startDate,
            @RequestParam("endDate") LocalDate endDate
    ) {
        return ApiResponse.onSuccess(adminService.getDataStatistics(startDate, endDate));
    }
}
