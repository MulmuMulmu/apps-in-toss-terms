package com.team200.graduation_project.domain.admin.service;

import com.team200.graduation_project.domain.admin.dto.request.AdminIngredientAliasRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminOcrIngredientUpdateRequest;
import com.team200.graduation_project.domain.admin.dto.request.AdminUserActionRequest;
import com.team200.graduation_project.domain.admin.dto.response.AdminDataStatisticsResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminOcrDetailResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminOcrListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminReportDetailResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminReportListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserDashboardResponse;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.ingredient.repository.IngredientAliasRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.domain.ingredient.repository.UserIngredientRepository;
import com.team200.graduation_project.domain.ocr.entity.Ocr;
import com.team200.graduation_project.domain.ocr.entity.OcrIngredient;
import com.team200.graduation_project.domain.ocr.repository.OcrIngredientRepository;
import com.team200.graduation_project.domain.ocr.repository.OcrRepository;
import com.team200.graduation_project.domain.share.entity.Report;
import com.team200.graduation_project.domain.share.entity.ReportStatus;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.repository.ReportRepository;
import com.team200.graduation_project.domain.share.repository.ShareRepository;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.jwt.JwtTokenService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;
    @Mock
    private IngredientAliasRepository ingredientAliasRepository;
    @Mock
    private UserIngredientRepository userIngredientRepository;
    @Mock
    private OcrRepository ocrRepository;
    @Mock
    private OcrIngredientRepository ocrIngredientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenService jwtTokenService;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ShareRepository shareRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void getUserDashboardCountsActiveUsers() {
        when(userRepository.countByRoleAndDeletedAtIsNull(Role.USER)).thenReturn(12L);
        when(userRepository.countByRoleAndStatusAndDeletedAtIsNull(Role.USER, UserStatus.WARMING))
                .thenReturn(2L);
        when(userRepository.countByRoleAndStatusAndDeletedAtIsNull(Role.USER, UserStatus.BLOCKED))
                .thenReturn(1L);

        AdminUserDashboardResponse result = adminService.getUserDashboard();

        assertThat(result.getTotalUsers()).isEqualTo(12L);
        assertThat(result.getAtLeastOneWarming()).isEqualTo(2L);
        assertThat(result.getPermanentSuspension()).isEqualTo(1L);
    }

    @Test
    void getUserListUsesActiveUsersForAllView() {
        User appUser = User.builder()
                .userId("toss_111")
                .tossUserKey("111111")
                .nickName("앱유저")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .warmingCount(0L)
                .build();
        when(userRepository.findAllByRoleAndDeletedAtIsNull(Role.USER))
                .thenReturn(List.of(appUser));
        when(shareRepository.countByUserAndDeletedAtIsNull(appUser)).thenReturn(3L);
        when(userIngredientRepository.countByUser(appUser)).thenReturn(4L);
        when(ocrRepository.countByUser(appUser)).thenReturn(5L);

        List<AdminUserListResponse> result = adminService.getUserList("all");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo("toss_111");
        assertThat(result.get(0).getTossUserKey()).isEqualTo("111111");
        verify(userRepository).findAllByRoleAndDeletedAtIsNull(Role.USER);
    }

    @Test
    void takeActionAgainstUserCanUseTossUserKeyAsOperatorIdentifier() {
        User user = User.builder()
                .userId("toss_222")
                .tossUserKey("222222")
                .nickName("대상자")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .warmingCount(0L)
                .build();
        when(userRepository.findByTossUserKeyAndDeletedAtIsNull("222222")).thenReturn(Optional.of(user));

        String result = adminService.takeActionAgainstUser(AdminUserActionRequest.builder()
                .tossUserKey("222222")
                .status("사용자 경고")
                .build());

        assertThat(result).isEqualTo("사용자에게 경고 하나를 부여했습니다.");
        assertThat(user.getStatus()).isEqualTo(UserStatus.WARMING);
        verify(userRepository).save(user);
    }

    @Test
    void completeReportMarksReportCompleted() {
        UUID reportId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Report report = Report.builder()
                .reportId(reportId)
                .content("신고 내용")
                .status(ReportStatus.NOT_COMPLETED)
                .build();
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));

        String result = adminService.completeReport(reportId);

        assertThat(result).isEqualTo("신고 처리가 완료되었습니다.");
        assertThat(report.getStatus()).isEqualTo(ReportStatus.COMPLETED);
        verify(reportRepository).save(report);
    }

    @Test
    void getReportListAndDetailExposeAppsInTossUserIdentifiers() {
        User reporter = User.builder()
                .userId("toss_111")
                .tossUserKey("111111")
                .nickName("신고자")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        User reported = User.builder()
                .userId("toss_222")
                .tossUserKey("222222")
                .nickName("대상자")
                .role(Role.USER)
                .status(UserStatus.WARMING)
                .warmingCount(3L)
                .build();
        UUID shareId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID reportId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Share share = Share.builder()
                .shareId(shareId)
                .user(reported)
                .title("나눔글")
                .content("본문")
                .category("채소/과일")
                .isView(true)
                .build();
        Report report = Report.builder()
                .reportId(reportId)
                .reporter(reporter)
                .share(share)
                .title("신고 제목")
                .content("신고 내용")
                .status(ReportStatus.NOT_COMPLETED)
                .build();
        when(reportRepository.findAllByCreateTimeBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(report));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));

        AdminReportListResponse listResult = adminService.getReportList(LocalDate.of(2026, 5, 1), "all");
        AdminReportDetailResponse detailResult = adminService.getReportDetail(reportId);

        AdminReportListResponse.ReportItemDTO item = listResult.getReports().get(0);
        assertThat(item.getReporterUserId()).isEqualTo("toss_111");
        assertThat(item.getReporterTossUserKey()).isEqualTo("111111");
        assertThat(item.getReportedUserId()).isEqualTo("toss_222");
        assertThat(item.getReportedTossUserKey()).isEqualTo("222222");
        assertThat(detailResult.getReporterUserId()).isEqualTo("toss_111");
        assertThat(detailResult.getReporterTossUserKey()).isEqualTo("111111");
        assertThat(detailResult.getReportedNameId()).isEqualTo("toss_222");
        assertThat(detailResult.getReportedTossUserKey()).isEqualTo("222222");
    }

    @Test
    void getOcrListAndDetailExposeAppsInTossUserIdentifiers() {
        UUID ocrId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        User user = User.builder()
                .userId("toss_333")
                .tossUserKey("333333")
                .nickName("업로더")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        Ocr ocr = Ocr.builder()
                .ocrId(ocrId)
                .user(user)
                .imageUrl("https://example.com/receipt.png")
                .accuracy(92.5)
                .build();
        when(ocrRepository.findAll()).thenReturn(List.of(ocr));
        when(ocrRepository.findById(ocrId)).thenReturn(Optional.of(ocr));

        AdminOcrListResponse listResult = adminService.getOcrList().get(0);
        AdminOcrDetailResponse detailResult = adminService.getOcrDetail(ocrId);

        assertThat(listResult.getUserId()).isEqualTo("toss_333");
        assertThat(listResult.getTossUserKey()).isEqualTo("333333");
        assertThat(listResult.getLoginProvider()).isEqualTo("APP_IN_TOSS");
        assertThat(detailResult.getUserId()).isEqualTo("toss_333");
        assertThat(detailResult.getTossUserKey()).isEqualTo("333333");
        assertThat(detailResult.getLoginProvider()).isEqualTo("APP_IN_TOSS");
    }

    @Test
    void getDataStatisticsCountsRegisteredUserIngredients() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 1, 10, 0);
        Ingredient onion = Ingredient.builder()
                .ingredientName("양파")
                .category("채소/과일")
                .build();
        User appUser = User.builder()
                .userId("toss_444")
                .tossUserKey("444444")
                .nickName("앱유저")
                .role(Role.USER)
                .status(UserStatus.NORMAL)
                .build();
        UserIngredient ingredient = UserIngredient.builder()
                .user(appUser)
                .ingredient(onion)
                .createTime(createdAt)
                .build();
        when(userIngredientRepository.findAllByCreateTimeBetween(
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(List.of(ingredient));

        List<AdminDataStatisticsResponse> result = adminService.getDataStatistics(
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 1)
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRank1()).containsExactly("양파", 1L);
        assertThat(result.get(0).getTotal()).isEqualTo(1L);
    }

    @Test
    void addIngredientAliasSavesAliasToCanonicalIngredient() {
        Ingredient milk = Ingredient.builder()
                .ingredientName("우유")
                .category("유제품")
                .build();
        when(ingredientAliasRepository.findByNormalizedAliasName("맛있는우유gt")).thenReturn(Optional.empty());
        when(ingredientRepository.findByIngredientName("우유")).thenReturn(Optional.of(milk));

        String result = adminService.addIngredientAlias(AdminIngredientAliasRequest.builder()
                .aliasName("맛있는우유GT")
                .ingredientName("우유")
                .source("admin_review")
                .build());

        assertThat(result).isEqualTo("식재료 별칭이 성공적으로 등록되었습니다.");
        ArgumentCaptor<IngredientAlias> captor = ArgumentCaptor.forClass(IngredientAlias.class);
        verify(ingredientAliasRepository).save(captor.capture());
        assertThat(captor.getValue().getAliasName()).isEqualTo("맛있는우유GT");
        assertThat(captor.getValue().getNormalizedAliasName()).isEqualTo("맛있는우유gt");
        assertThat(captor.getValue().getIngredient()).isEqualTo(milk);
        assertThat(captor.getValue().getSource()).isEqualTo("admin_review");
    }

    @Test
    void addIngredientAliasDoesNotSaveDuplicateNormalizedAlias() {
        Ingredient milk = Ingredient.builder()
                .ingredientName("우유")
                .category("유제품")
                .build();
        IngredientAlias existingAlias = IngredientAlias.builder()
                .aliasName("맛있는우유GT")
                .normalizedAliasName("맛있는우유gt")
                .ingredient(milk)
                .source("admin_review")
                .build();
        when(ingredientAliasRepository.findByNormalizedAliasName("맛있는우유gt"))
                .thenReturn(Optional.of(existingAlias));

        String result = adminService.addIngredientAlias(AdminIngredientAliasRequest.builder()
                .aliasName("맛있는우유GT")
                .ingredientName("우유")
                .source("admin_review")
                .build());

        assertThat(result).isEqualTo("식재료 별칭이 이미 등록되어 있습니다.");
        verify(ingredientAliasRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateOcrIngredientsRegistersAliasWhenAdminCorrectsRawProductToCanonicalIngredient() {
        UUID ocrId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID ocrIngredientId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Ocr ocr = Ocr.builder()
                .ocrId(ocrId)
                .build();
        OcrIngredient ocrIngredient = OcrIngredient.builder()
                .ocrIngredientId(ocrIngredientId)
                .ocr(ocr)
                .ocrIngredientName("초이스엘우유팩")
                .quantity(1)
                .build();
        Ingredient milk = Ingredient.builder()
                .ingredientName("우유")
                .category("유제품")
                .build();
        when(ocrRepository.findById(ocrId)).thenReturn(Optional.of(ocr));
        when(ocrIngredientRepository.findById(ocrIngredientId)).thenReturn(Optional.of(ocrIngredient));
        when(ingredientAliasRepository.findByNormalizedAliasName("초이스엘우유팩")).thenReturn(Optional.empty());
        when(ingredientRepository.findByIngredientName("우유")).thenReturn(Optional.of(milk));

        String result = adminService.updateOcrIngredients(AdminOcrIngredientUpdateRequest.builder()
                .ocrId(ocrId)
                .items(List.of(AdminOcrIngredientUpdateRequest.Item.builder()
                        .ocrIngredientId(ocrIngredientId)
                        .itemName("우유")
                        .quantity(1)
                        .build()))
                .build());

        assertThat(result).isEqualTo("OCR 품목이 수정 완료되었습니다.");
        assertThat(ocrIngredient.getOcrIngredientName()).isEqualTo("우유");
        ArgumentCaptor<IngredientAlias> captor = ArgumentCaptor.forClass(IngredientAlias.class);
        verify(ingredientAliasRepository).save(captor.capture());
        assertThat(captor.getValue().getAliasName()).isEqualTo("초이스엘우유팩");
        assertThat(captor.getValue().getIngredient()).isEqualTo(milk);
        assertThat(captor.getValue().getSource()).isEqualTo("ocr_admin_review");
    }
}
