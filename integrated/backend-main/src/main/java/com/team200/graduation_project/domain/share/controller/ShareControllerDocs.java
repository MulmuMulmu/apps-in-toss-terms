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
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Tag(name = "Share", description = "나눔 도메인 API")
public interface ShareControllerDocs {

    @Operation(summary = "위치 등록 (주소 변환)", description = "위도와 경도를 입력받아 카카오 API를 통해 실제 주소(지번)를 반환합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": {
                        "full_address": "경기 성남시 수정구 복정동 620-2",
                        "display_address": "복정동"
                      }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "위치 불러오기 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "위치를 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<LocationResponse> addLocation(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = true, content = @Content(schema = @Schema(implementation = LocationRequest.class), examples = @ExampleObject(value = """
                    {
                      "latitude": 37.450108,
                      "longitude": 127.129712
                    }
                    """))) LocationRequest request);

    @Operation(summary = "행정구역 위치 검색", description = "동/읍/면 이름을 검색해 나눔 위치로 설정할 수 있는 후보 좌표를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": [
                        {
                          "full_address": "경기 성남시 수정구 복정동",
                          "display_address": "복정동",
                          "latitude": 37.461,
                          "longitude": 127.126
                        }
                      ]
                    }
                    """)))
    })
    ApiResponse<List<LocationSearchResponse>> searchLocations(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "검색할 동/읍/면 이름") @RequestParam String query);

    @Operation(summary = "내 나눔 위치 조회", description = "현재 로그인 사용자가 저장한 나눔 기준 위치를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": {
                        "full_address": "경기 성남시 수정구 복정동",
                        "display_address": "복정동"
                      }
                    }
                    """)))
    })
    ApiResponse<LocationResponse> getMyLocation(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader);

    @Operation(summary = "나눔 게시글 등록", description = "사진 1장과 함께 사용자가 보유한 식재료의 이름을 입력하여 나눔 게시글을 등록합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "성공적으로 등록되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "필수 값 누락", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "SHARE400",
                      "result": "잘못된 요청입니다. (식재료 이름 누락 등)"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "식재료를 찾을 수 없음", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "SHARE404",
                      "result": "보유하고 있는 해당 식재료를 찾을 수 없습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "등록 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "게시글을 등록할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> publishSharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "나눔 게시글 정보 (식재료 이름 포함 필수)") ShareRequestDTO request);

    @Operation(summary = "내 주변 나눔 정보 리스트 조회", description = "내 위치 기반 주변 나눔 정보를 최신순으로 조회합니다. radiusKm 파라미터로 반경을 조정할 수 있습니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ShareListResponseDTO.class), examples = @ExampleObject(value = """
                    {
                    "success": true,
                    "result": {
                        "items": [
                          {
                            "postId": "aed70029-7b9e-4504-8ecd-5f09491cdbe7",
                            "title": "양배추 가져가실분~",
                            "locationName": "역삼동",
                            "distance": 0.8, 
                            "image": "https://...",
                            "createdAt": "2026-04-06T10:00:00Z"
                          }
                        ],
                        "totalCount": 25
                      }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "조회 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                    "success": false,
                    "code" : "COMMON500",
                    "result": "나눔 정보를 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<ShareListResponseDTO> getShareList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "조회 반경(km), 기본 10km, 최대 50km") @RequestParam(defaultValue = "10") Double radiusKm,
            @Parameter(description = "0부터 시작하는 페이지 번호") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "페이지 크기, 기본 10개, 최대 50개") @RequestParam(defaultValue = "10") Integer size);

    @Operation(summary = "나눔 게시글 상세 조회", description = "게시글 ID를 통해 특정 나눔 게시글의 상세 정보를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ShareDetailResponseDTO.class), examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": {
                        "image": "https://storage.googleapis.com/...",
                        "sellerName": "exampleUser",
                        "title": "exampleTitle",
                        "category": "농산물 or 원형 보존 농산물 or 건강기능식품",
                        "content": "exampleDescription",
                        "expirationDate": "2026-04-20",
                        "createTime": "2026-04-13T20:00:00"
                      }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "조회 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "나눔 정보를 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<ShareDetailResponseDTO> getShareDetail(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "게시글 ID") java.util.UUID postId);

    @Operation(summary = "내가 작성한 나눔글 리스트 조회", description = "내가 작성한 나눔글을 상태(나눔 중, 나눔 완료)에 따라 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = MyShareItemDTO.class)), examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": [
                        {
                          "postId": "examplePostId1",
                          "image": "https://storage.googleapis.com/...",
                          "title": "exampleTitle1",
                          "content": "exampleDescription1"
                        }
                      ]
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "조회 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "내 나눔 기록을 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<java.util.List<MyShareItemDTO>> getMyShareList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "나눔 상태 (나눔 중, 나눔 완료)") @RequestParam String type);

    @Operation(summary = "내가 작성한 나눔글 수정", description = "내가 작성한 특정 나눔글의 정보를 수정합니다. 식재료 이름으로 연결 대상 물품을 변경할 수 있습니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "수정 완료되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "식재료 또는 게시글을 찾을 수 없음", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "SHARE404",
                      "result": "보유하고 있는 해당 식재료를 찾을 수 없거나 게시글이 존재하지 않습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "수정 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "수정을 완료할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> updateMySharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "게시글 ID") @RequestParam java.util.UUID postId,
            @Parameter(description = "나눔 게시글 수정 정보 (식재료 이름 포함 시 변경)") ShareRequestDTO request);

    @Operation(summary = "내가 작성한 나눔글 삭제", description = "내가 작성한 특정 나눔글을 삭제(논리 삭제)합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "나눔글이 삭제되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "삭제 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "나눔글을 삭제할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> deleteMySharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "게시글 ID") @RequestParam java.util.UUID postId);

    @Operation(summary = "나눔 게시글 신고", description = "특정 나눔 게시글을 신고합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "신고가 완료되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "신고 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "신고할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> reportSharePosting(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "게시글 ID") @RequestParam java.util.UUID postId,
            @RequestBody ReportRequestDTO request);

    @Operation(summary = "나눔 완료 처리 (식재료 승계)", description = "나눔이 완료될 때 호출하며, 유형에 따라 식재료를 복제하거나 소유주를 변경합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "나눔 완료되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "완료 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "나눔을 완료할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> completeShareSuccession(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = true, content = @Content(schema = @Schema(implementation = ShareSuccessionRequestDTO.class), examples = @ExampleObject(value = """
                    {
                      "postId": "aed70029-7b9e-4504-8ecd-5f09491cdbe7",
                      "takerNicName": "홍길동",
                      "type": "전체"
                    }
                    """))) ShareSuccessionRequestDTO request);
}
