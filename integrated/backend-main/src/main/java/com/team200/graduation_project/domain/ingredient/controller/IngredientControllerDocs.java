package com.team200.graduation_project.domain.ingredient.controller;

import com.team200.graduation_project.domain.ingredient.dto.request.AllergyUpdateRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.ExtraInfoRequest;
import com.team200.graduation_project.domain.ingredient.dto.request.PreferUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientExpirationResponse;
import com.team200.graduation_project.domain.ingredient.dto.response.UserIngredientSearchResponse;

@Tag(name = "Ingredient", description = "재료 검색/첫 로그인 추가정보 API")
public interface IngredientControllerDocs {

    @Operation(
            summary = "재료 검색",
            description = "keyword로 재료명을 부분 검색하여 상위 10개를 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": {
                                                "ingredientNames": ["소고기", "돼지고기", "닭고기"]
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "잘못된 요청입니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<?> searchIngredients(
            @Parameter(description = "검색 키워드", required = true, example = "고기")
            @RequestParam String keyword
    );

    @Operation(
            summary = "카테고리별 표준 식재료 조회",
            description = "수동 입력에서 사용자가 검색으로 찾기 어려운 경우 카테고리별 표준 식재료명을 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": {
                                                "ingredientNames": ["계란", "돼지고기", "소고기"]
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "잘못된 요청입니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<?> listIngredientsByCategory(
            @Parameter(description = "카테고리명", required = true, example = "정육/계란")
            @RequestParam String category
    );

    @Operation(
            summary = "식재료 수동 등록",
            description = "사용자가 구매하거나 보유한 식재료를 수동으로 등록합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": "성공적으로 저장되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "식재료 저장 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "식재료를 저장할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> inputIngredients(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            [
                                             {
                                             "ingredient" : "바나나",
                                             "expirationDate" : "2026-04-06",
                                             "category" : "과일"
                                             },
                                             {
                                             "ingredient" : "부추",
                                             "expirationDate": "2026-05-10",
                                             "category" : "채소"
                                             }
                                            ]
                                            """
                            )
                    )
            )
            java.util.List<com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientInputRequest> request
    );

    @Operation(
            summary = "보유 식재료 목록 조회",
            description = "사용자가 보유한 식재료 목록을 카테고리별로 필터링하고 지정된 기준으로 정렬하여 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": [
                                                {
                                                  "sortRank" : 1,
                                                  "ingredient" : "사과",
                                                  "dDay" : 20,
                                                  "expirationDate" : "2026-05-01"
                                                },
                                                {
                                                  "sortRank" : 2,
                                                  "ingredient" : "돼지고기 앞다리살",
                                                  "dDay" : 30,
                                                  "expirationDate" : "2026-05-13"
                                                }
                                              ]
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 파라미터",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "reqeust 값을 정확하게 입력하여 주세요."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "식재료 목록 계산 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "식재료 목록을 계산할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<List<UserIngredientSearchResponse>> searchMyIngredients(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader,
            com.team200.graduation_project.domain.ingredient.dto.request.UserIngredientSearchRequest request
    );

    @Operation(
            summary = "소비기한 3일 이내 식재료 개수 반환",
            description = "사용자가 보유한 식재료 중 소비기한이 3일 이내인 항목의 개수를 불러옵니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": 3
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "목록 계산 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "소비기한 3일 내 식자재 개수를 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<Integer> countExpiringIngredients(
            @Parameter(
                    description = "JWT access token",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader
    );
    
    @Operation(
            summary = "유통기한 임박 식재료 목록 조회",
            description = "사용자가 보유한 식재료 중 유통기한이 임박한 항목들을 D-Day별로 그룹화하여 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": [
                                                {
                                                  "dDay" : 1,
                                                  "ingredient" : ["감자", "시금치"]
                                                },
                                                {
                                                  "dDay" : 2,
                                                  "ingredient" : ["당근", "오이"]
                                                }
                                              ]
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "목록 계산 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code" : "COMMON500",
                                              "result": "유통기한 임박 식재료를 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<List<UserIngredientExpirationResponse>> getNearExpiringIngredients(
            @Parameter(
                    description = "JWT access token",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader
    );

    @Operation(
            summary = "첫 로그인 추가정보 저장",
            description = """
                    첫 로그인 시 알레르기/선호/비선호 재료를 저장합니다.
                    DB에 식재료 정보가 없으면 저장되지 않습니다!
                    - allergies: 알레르기 재료명 리스트
                    - prefer_ingredients: 선호 재료명 리스트
                    - disprefer_ingredients: 비선호 재료명 리스트
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": "성공적으로 저장되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(mediaType = "application/json")
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> saveExtraInfo(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = ExtraInfoRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "allergies": ["계란"],
                                              "prefer_ingredients": ["우유"],
                                              "disprefer_ingredients": ["밀가루"]
                                            }
                                            """
                            )
                    )
            )
            ExtraInfoRequest request
    );

    @Operation(
            summary = "알러지 정보 수정",
            description = "사용자의 알러지 목록을 새 목록(newallergy)으로 갱신합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": "알러지 목록이 성공적으로 수정되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "알러지 수정 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "알러지를 수정할 수 있습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> updateAllergy(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = AllergyUpdateRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "oldallergy": ["땅콩", "새우"],
                                              "newallergy": ["땅콩", "밀", "우유"]
                                            }
                                            """
                            )
                    )
            )
            AllergyUpdateRequest request
    );

    @Operation(
            summary = "선호/비선호 식재료 수정",
            description = "type(선호/비선호)에 따라 선호 혹은 비선호 식재료 목록을 새 목록으로 갱신합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "result": "선호/비선호 목록이 성공적으로 수정되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "수정 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "선호, 비선호 목록을 수정할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> updatePrefer(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = PreferUpdateRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "type": "선호",
                                              "oldPrefer": ["감자", "소고기"],
                                              "newPrefer": ["고구마", "밥"]
                                            }
                                            """
                            )
                    )
            )
            PreferUpdateRequest request
    );
}

