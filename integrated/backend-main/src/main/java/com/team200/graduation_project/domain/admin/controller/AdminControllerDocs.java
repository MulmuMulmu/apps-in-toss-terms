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
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Admin", description = "관리자 관련 API")
@SecurityRequirement(name = "BearerAuth")
public interface AdminControllerDocs {

    @Operation(summary = "식재료 수동 추가", description = "관리자가 식재료를 수동으로 등록합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<String> addIngredients(@RequestBody List<AdminIngredientRequest> requests);

    @Operation(summary = "식재료 별칭 추가", description = "관리자가 OCR/사용자 입력 상품명을 표준 식재료명에 연결합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<String> addIngredientAlias(@RequestBody AdminIngredientAliasRequest request);

    @Operation(summary = "관리자 로그인", description = "관리자 계정으로 로그인합니다.", security = {})
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Bad Request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<AdminLoginResponse> login(@RequestBody AdminLoginRequest request);

    @Operation(summary = "관리자 로그아웃", description = "관리자 세션을 종료합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<String> logout();

    @Operation(summary = "사용자 통계 정보 조회", description = "관리자 대시보드에서 사용자 통계 정보를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<AdminUserDashboardResponse> getUserDashboard();

    @Operation(summary = "당일 신고 건수 조회", description = "관리자 대시보드에서 당일 신고된 전체 건수, 미완료 건수, 완료 건수를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<AdminTodayReportResponse> getTodayReports();

    @Operation(summary = "당일 새로운 나눔 수 조회", description = "관리자 대시보드에서 당일 생성된 새로운 나눔 게시글 수를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal Server Error")
    })
    ApiResponse<AdminTodayShareResponse> getTodayShares();

    @Operation(summary = "신고 목록 조회", description = "날짜와 처리 상태에 따라 신고 목록을 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "신고 목록을 조회할 수 없습니다.")
    })
    ApiResponse<AdminReportListResponse> getReportList(
            @RequestParam("Date") LocalDate date,
            @RequestParam("type") String type
    );

    @Operation(summary = "신고 내역 상세 조회", description = "신고 내역 한 건을 상세하게 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200", 
                    description = "OK",
                    content = @io.swagger.v3.oas.annotations.media.Content(
                            mediaType = "application/json",
                            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": {
                                                "reporterName" : "물무",
                                                "reportedName": "나연",
                                                "reportedNameId": "exampleUserId",
                                                "totalWarming" : 1,
                                                "title": "ExampleReportName",
                                                "content" : "ExmapleContent"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500", 
                    description = "신고 내역 한 건을 자세히 불러올 수 없습니다.",
                    content = @io.swagger.v3.oas.annotations.media.Content(
                            mediaType = "application/json",
                            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code" : "COMMON500",
                                              "result": "신고 내역 한 건을 자세히 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    ApiResponse<AdminReportDetailResponse> getReportDetail(
            @RequestParam("reportId") UUID reportId
    );

    @Operation(summary = "신고 게시글 숨김 처리", description = "신고된 게시글을 숨김 처리하여 다른 사용자가 볼 수 없게 합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "게시글이 숨김 처리 되었습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "이미 숨김처리된 게시글입니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "게시글을 숨김 처리 할 수 없습니다.")
    })
    ApiResponse<String> maskSharePost(
            @RequestParam("shareId") UUID shareId
    );

    @Operation(summary = "신고 사용자 조치", description = "신고된 사용자에게 경고를 부여하거나 영구 정지 처리를 합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "사용자 상태를 변경할 수 없습니다.")
    })
    ApiResponse<String> takeActionAgainstUser(
            @RequestBody AdminUserActionRequest request
    );

    @Operation(summary = "나눔글 상세 조회", description = "나눔글 한 건을 상세하게 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "나눔 정보를 불러올 수 없습니다.")
    })
    ApiResponse<AdminShareDetailResponse> getShareDetail(
            @RequestParam("shareId") UUID shareId
    );

    @Operation(summary = "사용자 리스트 조회", description = "사용자 리스트를 조회합니다. userId가 'all'이면 전체 조회를 수행합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "사용자 리스트를 불러올 수 없습니다.")
    })
    ApiResponse<List<AdminUserListResponse>> getUserList(
            @RequestParam("userId") String userId
    );

    @Operation(summary = "사용자 작성 나눔글 리스트 조회", description = "특정 사용자가 작성한 나눔글 리스트를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "사용자의 나눔 리스트를 불러올 수 없습니다.")
    })
    ApiResponse<List<AdminUserShareListResponse>> getUserShareList(
            @RequestParam("userId") String userId
    );

    @Operation(summary = "OCR 검수 대기 목록 조회", description = "OCR 검수 대기 목록을 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "OCR 검수 대기 목록을 불러올 수 없습니다.")
    })
    ApiResponse<List<AdminOcrListResponse>> getOcrList();

    @Operation(summary = "OCR 상세 조회", description = "OCR 검수 한 건을 상세하게 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "OCR 검수 한 건을 불러올 수 없습니다.")
    })
    ApiResponse<AdminOcrDetailResponse> getOcrDetail(
            @RequestParam("ocrId") UUID ocrId
    );

    @Operation(summary = "OCR 스캔 식재료 품목 조회", description = "OCR로 스캔한 식재료 품목 리스트를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "OCR로 스캔한 식재료 품목을 불러올 수 없습니다.")
    })
    ApiResponse<List<AdminOcrIngredientResponse>> getOcrIngredients(
            @RequestParam("ocrId") UUID ocrId
    );

    @Operation(summary = "OCR 정확도 수정", description = "OCR 정확도를 수동으로 수정합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "ocr 정확도를 수정할 수 없습니다.")
    })
    ApiResponse<String> updateOcrAccuracy(
            @RequestBody AdminOcrAccuracyRequest request
    );

    @Operation(summary = "OCR 스캔 식재료 품목 수정", description = "관리자가 OCR 품목명, 수량, 정확도를 검수 후 수정합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "OCR 품목을 수정할 수 없습니다.")
    })
    ApiResponse<String> updateOcrIngredients(
            @RequestBody AdminOcrIngredientUpdateRequest request
    );

    @Operation(summary = "식재료 수집 데이터 통계 조회", description = "특정 기간 동안의 식재료 수집 데이터 통계를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OK"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "OCR 데이터 통계를 불러올 수 없습니다.")
    })
    ApiResponse<List<AdminDataStatisticsResponse>> getDataStatistics(
            @RequestParam("startDate") LocalDate startDate,
            @RequestParam("endDate") LocalDate endDate
    );
}
