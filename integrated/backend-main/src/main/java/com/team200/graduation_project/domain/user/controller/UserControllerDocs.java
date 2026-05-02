package com.team200.graduation_project.domain.user.controller;

import com.team200.graduation_project.domain.user.dto.request.ChangePasswordRequest;
import com.team200.graduation_project.domain.user.dto.request.ChangeNicknameRequest;
import com.team200.graduation_project.domain.user.dto.request.KakaoSignupRequest;
import com.team200.graduation_project.domain.user.dto.request.LoginRequest;
import com.team200.graduation_project.domain.user.dto.request.TossLoginRequest;
import com.team200.graduation_project.domain.user.dto.request.UserSignupRequest;
import com.team200.graduation_project.domain.user.dto.response.LoginResponse;
import com.team200.graduation_project.domain.user.dto.response.UserMypageResponse;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Auth", description = "회원 인증/계정 관련 API")
public interface UserControllerDocs {

    @Operation(
            summary = "아이디 중복 체크",
            description = "회원가입 전 사용할 아이디가 중복인지 확인합니다."
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
                                               "result": "사용가능한 id 입니다."
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
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> checkIdDuplicated(
            @Parameter(name = "id", description = "중복 확인할 아이디", example = "test_user")
            String id
    );

    @Operation(
            summary = "회원가입",
            description = "일반 회원가입을 진행합니다."
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
                                              "result": "회원가입이 완료되었습니다"
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
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "회원가입 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "회원가입을 완료할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> signup(
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = UserSignupRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "name": "홍길동",
                                              "id": "test_user",
                                              "password": "abcd1234",
                                              "check_password": "abcd1234"
                                            }
                                            """
                            )
                    )
            )
            UserSignupRequest request
    );

    @Operation(
            summary = "카카오 회원가입",
            description = "카카오 인증코드 기반으로 회원가입을 진행합니다."
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
                                              "result": "회원가입이 완료되었습니다"
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "카카오 토큰 값 누락",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "카카오 토큰 값을 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> signupWithKakao(
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = KakaoSignupRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "authorizationCode": "kakao_auth_code"
                                            }
                                            """
                            )
                    )
            )
            KakaoSignupRequest request
    );

    @Operation(
            summary = "로그인",
            description = "아이디/비밀번호로 로그인하고 JWT access token을 발급받습니다."
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
                                                "accessToken": "exampleAccessToken",
                                                "firstLogin": true
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "로그인 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "로그인 할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<LoginResponse> login(
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = LoginRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "id": "test_user",
                                              "password": "abcd1234"
                                            }
                                            """
                            )
                    )
            )
            LoginRequest request
    );

    @Operation(
            summary = "카카오 로그인",
            description = "카카오 인증코드 기반으로 로그인하고 JWT access token을 발급받습니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "성공",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "로그인 실패",
                    content = @Content(mediaType = "application/json")
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<LoginResponse> loginWithKakao(
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = KakaoSignupRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "authorizationCode": "kakao_auth_code"
                                            }
                                            """
                            )
                    )
            )
            KakaoSignupRequest request
    );

    @Operation(
            summary = "토스 로그인",
            description = "앱인토스 appLogin으로 받은 authorizationCode를 서버에서 토스 AccessToken과 userKey로 교환한 뒤 JWT를 발급합니다."
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
                                                "jwt": "exampleAccessToken",
                                                "firstLogin": true
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "로그인 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "로그인 할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<LoginResponse> loginWithToss(
            @RequestBody(
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = TossLoginRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "authorizationCode": "apps_in_toss_authorization_code",
                                              "referrer": "DEFAULT"
                                            }
                                            """
                            )
                    )
            )
            TossLoginRequest request
    );

    @Operation(
            summary = "로그아웃",
            description = "서버에서 토큰을 무효화/블랙리스트 저장하지 않습니다. 클라이언트에서 토큰을 삭제하면 로그아웃이 완료됩니다."
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
                                              "result": "로그아웃 완료되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "로그아웃 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "로그아웃 할 수 없습니다"
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> logout(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    );

    @Operation(
            summary = "회원탈퇴(소프트 딜리트)",
            description = "사용자 레코드를 물리 삭제하지 않고 deletedAt을 설정하여 탈퇴 처리합니다."
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
                                              "result": "회원탈퇴가 완료되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "회원탈퇴 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "회원탈퇴를 할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> deleteAccount(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader
    );

    @Operation(
            summary = "비밀번호 변경",
            description = "Authorization 헤더의 토큰으로 사용자 식별 후, oldPassword 검증이 통과하면 새 비밀번호로 변경합니다."
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
                                              "result": "비밀번호가 성공적으로 변경되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "이전 비밀번호 불일치",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "이전 비밀번호가 일치하지 않습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "비밀번호 변경 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "비밀번호를 변경할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> changePassword(
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
                            schema = @Schema(implementation = ChangePasswordRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "oldPassword": "abcd1234",
                                              "newPassword": "efgh1234"
                                            }
                                            """
                            )
                    )
            )
            ChangePasswordRequest request
    );

    @Operation(
            summary = "닉네임 변경",
            description = "Authorization 헤더의 토큰으로 사용자 식별 후, oldnickName 검증이 통과하면 새 닉네임으로 변경합니다."
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
                                              "result": "닉네임이 성공적으로 변경되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "이전 닉네임 불일치",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON400",
                                              "result": "이전 닉네임이 일치하지 않습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "닉네임 변경 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "닉네임을 변경할 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> changeNickname(
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
                            schema = @Schema(implementation = ChangeNicknameRequest.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "oldnickName": "물무11",
                                              "newnickName": "물무22"
                                            }
                                            """
                            )
                    )
            )
            ChangeNicknameRequest request
    );

    @Operation(
            summary = "프로필 사진 변경",
            description = "사용자의 프로필 사진을 변경합니다. Content-Type은 multipart/form-data로 요청해야 합니다."
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
                                              "result": "프로필사진이 변경되었습니다."
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "사진 변경 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "사진을 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<String> updateProfilePicture(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(
                    description = "프로필 사진 파일 (jpg/png)",
                    required = true
            )
            @RequestPart("image") MultipartFile image
    );

    @Operation(
            summary = "마이페이지 조회",
            description = "사용자의 닉네임과 프로필 사진 URL을 조회합니다."
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
                                                "nickName": "mulmu",
                                                "profileImageUrl": "https://~~~"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "조회 실패",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "code": "COMMON500",
                                              "result": "사용자 정보를 불러올 수 없습니다."
                                            }
                                            """
                            )
                    )
            )
    })
    com.team200.graduation_project.global.apiPayload.ApiResponse<UserMypageResponse> getMypage(
            @Parameter(
                    description = "JWT access token (Bearer prefix 포함 가능)",
                    required = false,
                    hidden = true,
                    example = "Bearer exampleToken"
            )
            @RequestHeader("Authorization") String authorizationHeader
    );
}

