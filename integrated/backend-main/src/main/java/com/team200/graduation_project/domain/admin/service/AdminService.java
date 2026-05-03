package com.team200.graduation_project.domain.admin.service;

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
import com.team200.graduation_project.domain.admin.dto.response.AdminTodayReportResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserShareListResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminTodayShareResponse;
import com.team200.graduation_project.domain.admin.dto.response.AdminUserDashboardResponse;
import com.team200.graduation_project.domain.admin.exception.AdminErrorCode;
import com.team200.graduation_project.domain.admin.exception.AdminException;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import com.team200.graduation_project.domain.ingredient.repository.IngredientAliasRepository;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final IngredientRepository ingredientRepository;
    private final IngredientAliasRepository ingredientAliasRepository;
    private final UserIngredientRepository userIngredientRepository;
    private final OcrRepository ocrRepository;
    private final OcrIngredientRepository ocrIngredientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final ReportRepository reportRepository;
    private final ShareRepository shareRepository;

    public void addIngredients(List<AdminIngredientRequest> requests) {
        List<Ingredient> ingredients = requests.stream()
                .map(request -> Ingredient.builder()
                        .ingredientName(request.getIngredient())
                        .category(request.getCategory())
                        .build())
                .collect(Collectors.toList());

        ingredientRepository.saveAll(ingredients);
    }

    public String addIngredientAlias(AdminIngredientAliasRequest request) {
        if (request == null
                || !StringUtils.hasText(request.getAliasName())
                || !StringUtils.hasText(request.getIngredientName())) {
            throw new AdminException(AdminErrorCode.ADMIN_INGREDIENT_ERROR);
        }

        String normalizedAliasName = IngredientAlias.normalize(request.getAliasName());
        if (ingredientAliasRepository.findByNormalizedAliasName(normalizedAliasName).isPresent()) {
            return "식재료 별칭이 이미 등록되어 있습니다.";
        }

        Ingredient ingredient = ingredientRepository.findByIngredientName(request.getIngredientName().trim())
                .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_INGREDIENT_ERROR));

        ingredientAliasRepository.save(IngredientAlias.builder()
                .aliasName(request.getAliasName().trim())
                .normalizedAliasName(normalizedAliasName)
                .ingredient(ingredient)
                .source(StringUtils.hasText(request.getSource()) ? request.getSource().trim() : "admin")
                .build());

        return "식재료 별칭이 성공적으로 등록되었습니다.";
    }

    public AdminLoginResponse login(AdminLoginRequest request) {
        User user = userRepository.findByUserIdIsAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_LOGIN_FAILED));

        if (user.getRole() != Role.ADMIN) {
            throw new AdminException(AdminErrorCode.ADMIN_LOGIN_FAILED);
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AdminException(AdminErrorCode.ADMIN_LOGIN_FAILED);
        }

        String jwt = jwtTokenService.issueTokenPair(user.getUserId()).accessToken();
        return AdminLoginResponse.builder()
                .jwt(jwt)
                .build();
    }

    public String logout() {
        try {
            return "로그아웃 되었습니다.";
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_LOGOUT_ERROR);
        }
    }

    public AdminUserDashboardResponse getUserDashboard() {
        try{
            Long totalUsers = userRepository.countByRoleAndDeletedAtIsNull(Role.USER);
            Long atLeastOneWarming = userRepository.countByRoleAndStatusAndDeletedAtIsNull(Role.USER, UserStatus.WARMING);
            Long permanentSuspension = userRepository.countByRoleAndStatusAndDeletedAtIsNull(Role.USER, UserStatus.BLOCKED);

            return AdminUserDashboardResponse.builder()
                    .totalUsers(totalUsers)
                    .atLeastOneWarming(atLeastOneWarming)
                    .permanentSuspension(permanentSuspension)
                    .build();
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_DASHBOARD_ERROR);
        }
    }

    public AdminTodayReportResponse getTodayReports() {
        try {
            LocalDateTime start = LocalDateTime.now().with(LocalTime.MIN);
            LocalDateTime end = LocalDateTime.now().with(LocalTime.MAX);

            Long todayReports = reportRepository.countByCreateTimeBetween(start, end);
            Long notCompletedReports = reportRepository.countByCreateTimeBetweenAndStatus(start, end, ReportStatus.NOT_COMPLETED);
            Long completedReports = reportRepository.countByCreateTimeBetweenAndStatus(start, end, ReportStatus.COMPLETED);

            return AdminTodayReportResponse.builder()
                    .todayReports(todayReports)
                    .notCompletedReports(notCompletedReports)
                    .completedReports(completedReports)
                    .build();
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_TODAY_REPORT_ERROR);
        }
    }

    public AdminTodayShareResponse getTodayShares() {
        try {
            LocalDateTime start = LocalDateTime.now().with(LocalTime.MIN);
            LocalDateTime end = LocalDateTime.now().with(LocalTime.MAX);

            Long todayShares = shareRepository.countByCreateTimeBetween(start, end);

            return AdminTodayShareResponse.builder()
                    .todayShares(todayShares)
                    .build();
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_TODAY_SHARE_ERROR);
        }
    }

    public AdminReportListResponse getReportList(LocalDate date, String type) {
        try {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);

            List<Report> reports;
            if ("completed".equalsIgnoreCase(type)) {
                reports = reportRepository.findAllByCreateTimeBetweenAndStatus(start, end, ReportStatus.COMPLETED);
            } else if ("notCompleted".equalsIgnoreCase(type)) {
                reports = reportRepository.findAllByCreateTimeBetweenAndStatus(start, end, ReportStatus.NOT_COMPLETED);
            } else {
                reports = reportRepository.findAllByCreateTimeBetween(start, end);
            }

            List<AdminReportListResponse.ReportItemDTO> reportItems = reports.stream()
                    .map(report -> {
                        User reporter = report.getReporter();
                        Share share = report.getShare();
                        boolean chatReport = isChatReport(report);
                        User reported = resolveReportedUser(report, share, chatReport);
                        return AdminReportListResponse.ReportItemDTO.builder()
                                .reportId(report.getReportId())
                                .shareId(share != null ? share.getShareId() : null)
                                .reporterName(reporter != null ? reporter.getNickName() : null)
                                .reporterUserId(reporter != null ? reporter.getUserId() : null)
                                .reporterTossUserKey(reporter != null ? reporter.getTossUserKey() : null)
                                .reporterLoginProvider(resolveLoginProvider(reporter))
                                .reportedName(reported != null ? reported.getNickName() : null)
                                .reportedUserId(reported != null ? reported.getUserId() : null)
                                .reportedTossUserKey(reported != null ? reported.getTossUserKey() : null)
                                .reportedLoginProvider(resolveLoginProvider(reported))
                                .reportType(chatReport ? "CHAT" : "SHARE")
                                .reportTypeLabel(chatReport ? "채팅 신고" : "나눔 신고")
                                .chatRoomId(chatReport ? extractChatRoomId(report.getContent()) : null)
                                .content(report.getContent())
                                .status(report.getStatus().getDescription())
                                .build();
                    })
                    .collect(Collectors.toList());

            return AdminReportListResponse.builder()
                    .reports(reportItems)
                    .build();
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_REPORT_LIST_ERROR);
        }
    }

    public AdminReportDetailResponse getReportDetail(UUID reportId) {
        try {
            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_REPORT_DETAIL_ERROR));

            User reporter = report.getReporter();
            Share share = report.getShare();
            boolean chatReport = isChatReport(report);
            User reported = resolveReportedUser(report, share, chatReport);

            return AdminReportDetailResponse.builder()
                    .reporterName(reporter != null ? reporter.getNickName() : null)
                    .reporterUserId(reporter != null ? reporter.getUserId() : null)
                    .reporterTossUserKey(reporter != null ? reporter.getTossUserKey() : null)
                    .reporterLoginProvider(resolveLoginProvider(reporter))
                    .reportedName(reported != null ? reported.getNickName() : null)
                    .reportedNameId(reported != null ? reported.getUserId() : null)
                    .reportedTossUserKey(reported != null ? reported.getTossUserKey() : null)
                    .reportedLoginProvider(resolveLoginProvider(reported))
                    .reportType(chatReport ? "CHAT" : "SHARE")
                    .reportTypeLabel(chatReport ? "채팅 신고" : "나눔 신고")
                    .chatRoomId(chatReport ? extractChatRoomId(report.getContent()) : null)
                    .totalWarming(reported != null && reported.getWarmingCount() != null ? reported.getWarmingCount() : 0L)
                    .title(report.getTitle())
                    .content(report.getContent())
                    .build();
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_REPORT_DETAIL_ERROR);
        }
    }

    public void maskSharePost(UUID shareId) {
        try {
            Share share = shareRepository.findById(shareId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_SHARE_MASKING_ERROR));

            if (share.getIsView() != null && !share.getIsView()) {
                throw new AdminException(AdminErrorCode.ADMIN_SHARE_ALREADY_MASKED);
            }

            share.mask();
            shareRepository.save(share);
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_SHARE_MASKING_ERROR);
        }
    }

    public String completeReport(UUID reportId) {
        try {
            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_REPORT_STATUS_UPDATE_ERROR));
            report.complete();
            reportRepository.save(report);
            return "신고 처리가 완료되었습니다.";
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_REPORT_STATUS_UPDATE_ERROR);
        }
    }

    public String takeActionAgainstUser(AdminUserActionRequest request) {
        try {
            User user = resolveActionTargetUser(request)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_USER_ACTION_ERROR));

            String resultMessage;
            if ("영구정지".equals(request.getStatus())) {
                user.block();
                resultMessage = "사용자가 영구 정지 되었습니다.";
            } else if ("사용자 경고".equals(request.getStatus())) {
                user.addWarning();
                resultMessage = "사용자에게 경고 하나를 부여했습니다.";
            } else {
                throw new AdminException(AdminErrorCode.ADMIN_USER_ACTION_ERROR);
            }

            userRepository.save(user);
            return resultMessage;
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_USER_ACTION_ERROR);
        }
    }

    public AdminShareDetailResponse getShareDetail(UUID shareId) {
        try {
            Share share = shareRepository.findById(shareId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_SHARE_DETAIL_ERROR));

            String imageUrl = share.getSharePicture() != null ? share.getSharePicture().getPictureUrl() : null;
            String ingredientName = share.getUserIngredient() != null && share.getUserIngredient().getIngredient() != null 
                    ? share.getUserIngredient().getIngredient().getIngredientName() 
                    : null;

            return AdminShareDetailResponse.builder()
                    .image(imageUrl)
                    .sellerName(share.getUser().getNickName())
                    .sellerUserId(share.getUser().getUserId())
                    .sellerTossUserKey(share.getUser().getTossUserKey())
                    .sellerLoginProvider(resolveLoginProvider(share.getUser()))
                    .title(share.getTitle())
                    .category(share.getCategory())
                    .description(share.getContent())
                    .ingredient(ingredientName)
                    .createTime(share.getCreateTime())
                    .build();
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_SHARE_DETAIL_ERROR);
        }
    }

    public List<AdminUserListResponse> getUserList(String userId) {
        try {
            List<User> users;
            if ("all".equals(userId)) {
                users = userRepository.findAllByRoleAndDeletedAtIsNull(Role.USER);
            } else {
                users = userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                        .filter(user -> user.getRole() == Role.USER)
                        .map(Collections::singletonList)
                        .orElse(Collections.emptyList());
            }

            List<AdminUserListResponse> result = new ArrayList<>();
            for (int i = 0; i < users.size(); i++) {
                User user = users.get(i);
                Long totalShare = shareRepository.countByUserAndDeletedAtIsNull(user);

                result.add(AdminUserListResponse.builder()
                        .number(i + 1)
                        .userId(user.getUserId())
                        .tossUserKey(user.getTossUserKey())
                        .loginProvider(resolveLoginProvider(user))
                        .nickName(user.getNickName())
                        .status(user.getStatus() != null ? user.getStatus().getDescription() : "-")
                        .totalWarming(user.getWarmingCount() != null ? user.getWarmingCount() : 0L)
                        .totalIngredient(userIngredientRepository.countByUser(user))
                        .totalOcr(ocrRepository.countByUser(user))
                        .totalShare(totalShare)
                        .build());
            }
            return result;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_USER_LIST_ERROR);
        }
    }

    private Optional<User> resolveActionTargetUser(AdminUserActionRequest request) {
        if (request != null && StringUtils.hasText(request.getTossUserKey())) {
            return userRepository.findByTossUserKeyAndDeletedAtIsNull(request.getTossUserKey());
        }
        if (request != null && StringUtils.hasText(request.getUserId())) {
            return userRepository.findByUserIdIsAndDeletedAtIsNull(request.getUserId());
        }
        return Optional.empty();
    }

    private String resolveLoginProvider(User user) {
        if (user == null) {
            return null;
        }
        if (StringUtils.hasText(user.getTossUserKey())) {
            return "APP_IN_TOSS";
        }
        if (user.getUserId() != null && user.getUserId().startsWith("kakao_")) {
            return "KAKAO";
        }
        return "LOCAL";
    }

    private boolean isChatReport(Report report) {
        if (report == null) {
            return false;
        }
        return (StringUtils.hasText(report.getTitle()) && report.getTitle().startsWith("채팅 신고"))
                || (StringUtils.hasText(report.getContent()) && report.getContent().contains("채팅방 ID:"));
    }

    private User resolveReportedUser(Report report, Share share, boolean chatReport) {
        if (chatReport) {
            String reportedUserId = extractLabeledValue(report.getContent(), "신고 대상 ID:");
            if (StringUtils.hasText(reportedUserId)) {
                return userRepository.findByUserIdIsAndDeletedAtIsNull(reportedUserId).orElse(null);
            }
        }
        return share != null ? share.getUser() : null;
    }

    private String extractChatRoomId(String content) {
        return extractLabeledValue(content, "채팅방 ID:");
    }

    private String extractLabeledValue(String content, String label) {
        if (!StringUtils.hasText(content)) {
            return null;
        }
        for (String line : content.split("\\R")) {
            if (line.startsWith(label)) {
                String value = line.substring(label.length()).trim();
                return value.isEmpty() ? null : value;
            }
        }
        return null;
    }

    public List<AdminUserShareListResponse> getUserShareList(String userId) {
        try {
            User user = userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_USER_SHARE_LIST_ERROR));

            List<Share> shares = shareRepository.findAllByUserAndDeletedAtIsNullOrderByCreateTimeDesc(user);

            return shares.stream()
                    .map(share -> AdminUserShareListResponse.builder()
                            .shareId(share.getShareId())
                            .image(share.getSharePicture() != null ? share.getSharePicture().getPictureUrl() : null)
                            .title(share.getTitle())
                            .content(share.getContent())
                            .build())
                    .collect(Collectors.toList());
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_USER_SHARE_LIST_ERROR);
        }
    }

    public List<AdminOcrListResponse> getOcrList() {
        try {
            return ocrRepository.findAll().stream()
                    .map(ocr -> AdminOcrListResponse.builder()
                            .ocrId(ocr.getOcrId())
                            .userId(ocr.getUser() != null ? ocr.getUser().getUserId() : null)
                            .tossUserKey(ocr.getUser() != null ? ocr.getUser().getTossUserKey() : null)
                            .loginProvider(ocr.getUser() != null ? resolveLoginProvider(ocr.getUser()) : null)
                            .nickName(ocr.getUser() != null ? ocr.getUser().getNickName() : null)
                            .createTime(ocr.getCreateTime())
                            .accuracy(ocr.getAccuracy())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_OCR_LIST_ERROR);
        }
    }

    public AdminOcrDetailResponse getOcrDetail(UUID ocrId) {
        try {
            Ocr ocr = ocrRepository.findById(ocrId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_OCR_DETAIL_ERROR));

            return AdminOcrDetailResponse.builder()
                    .receiptImage(resolveLocalUploadUrl(ocr.getImageUrl()))
                    .purchaseTime(ocr.getPurchaseTime())
                    .createTime(ocr.getCreateTime())
                    .userId(ocr.getUser() != null ? ocr.getUser().getUserId() : null)
                    .tossUserKey(ocr.getUser() != null ? ocr.getUser().getTossUserKey() : null)
                    .loginProvider(ocr.getUser() != null ? resolveLoginProvider(ocr.getUser()) : null)
                    .nickName(ocr.getUser() != null ? ocr.getUser().getNickName() : null)
                    .accuracy(ocr.getAccuracy())
                    .build();
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_OCR_DETAIL_ERROR);
        }
    }

    public List<AdminOcrIngredientResponse> getOcrIngredients(UUID ocrId) {
        try {
            Ocr ocr = ocrRepository.findById(ocrId)
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_OCR_DETAIL_ERROR));

            return ocrIngredientRepository.findAllByOcr(ocr).stream()
                    .map(ocrIngredient -> AdminOcrIngredientResponse.builder()
                            .ocrIngredientId(ocrIngredient.getOcrIngredientId())
                            .itemName(ocrIngredient.getOcrIngredientName())
                            .originalItemName(resolveOriginalOcrIngredientName(ocrIngredient))
                            .normalizedItemName(resolveNormalizedOcrIngredientName(ocrIngredient))
                            .category(resolveOcrIngredientCategory(ocrIngredient))
                            .quantity(ocrIngredient.getQuantity())
                            .build())
                    .collect(Collectors.toList());
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_OCR_INGREDIENT_LIST_ERROR);
        }
    }

    public String updateOcrAccuracy(AdminOcrAccuracyRequest request) {
        try {
            Ocr ocr = ocrRepository.findById(request.getOcrId())
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_OCR_ACCURACY_UPDATE_ERROR));

            ocr.updateAccuracy(request.getAccuracy());
            ocrRepository.save(ocr);
            return "ocr 정확도가 수정 완료되었습니다.";
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_OCR_ACCURACY_UPDATE_ERROR);
        }
    }

    public String updateOcrIngredients(AdminOcrIngredientUpdateRequest request) {
        try {
            Ocr ocr = ocrRepository.findById(request.getOcrId())
                    .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_OCR_INGREDIENT_UPDATE_ERROR));

            if (request.getAccuracy() != null) {
                ocr.updateAccuracy(request.getAccuracy());
            }

            if (request.getItems() != null) {
                for (AdminOcrIngredientUpdateRequest.Item item : request.getItems()) {
                    OcrIngredient ocrIngredient = ocrIngredientRepository.findById(item.getOcrIngredientId())
                            .orElseThrow(() -> new AdminException(AdminErrorCode.ADMIN_OCR_INGREDIENT_UPDATE_ERROR));

                    if (!ocrIngredient.getOcr().getOcrId().equals(ocr.getOcrId())) {
                        throw new AdminException(AdminErrorCode.ADMIN_OCR_INGREDIENT_UPDATE_ERROR);
                    }

                    registerAliasFromOcrCorrection(resolveOriginalOcrIngredientName(ocrIngredient), item.getItemName());
                    ocrIngredient.update(item.getItemName(), item.getQuantity());
                }
            }

            return "OCR 품목이 수정 완료되었습니다.";
        } catch (AdminException e) {
            throw e;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_OCR_INGREDIENT_UPDATE_ERROR);
        }
    }

    private void registerAliasFromOcrCorrection(String originalName, String correctedName) {
        if (!StringUtils.hasText(originalName) || !StringUtils.hasText(correctedName)) {
            return;
        }
        String trimmedOriginalName = originalName.trim();
        String trimmedCorrectedName = correctedName.trim();
        if (trimmedOriginalName.equals(trimmedCorrectedName)) {
            return;
        }

        String normalizedAliasName = IngredientAlias.normalize(trimmedOriginalName);
        if (ingredientAliasRepository.findByNormalizedAliasName(normalizedAliasName).isPresent()) {
            return;
        }

        ingredientRepository.findByIngredientName(trimmedCorrectedName)
                .ifPresent(ingredient -> ingredientAliasRepository.save(IngredientAlias.builder()
                        .aliasName(trimmedOriginalName)
                        .normalizedAliasName(normalizedAliasName)
                        .ingredient(ingredient)
                        .source("ocr_admin_review")
                        .build()));
    }

    private String resolveLocalUploadUrl(String imageUrl) {
        String localBucketPrefix = "https://storage.googleapis.com/local-bucket/";
        if (StringUtils.hasText(imageUrl) && imageUrl.startsWith(localBucketPrefix)) {
            return "http://localhost:8080/local-uploads/" + imageUrl.substring(localBucketPrefix.length());
        }
        return imageUrl;
    }

    private String resolveOriginalOcrIngredientName(OcrIngredient ocrIngredient) {
        if (StringUtils.hasText(ocrIngredient.getOriginalOcrIngredientName())) {
            return ocrIngredient.getOriginalOcrIngredientName();
        }
        return ocrIngredient.getOcrIngredientName();
    }

    private String resolveNormalizedOcrIngredientName(OcrIngredient ocrIngredient) {
        if (StringUtils.hasText(ocrIngredient.getNormalizedIngredientName())) {
            return ocrIngredient.getNormalizedIngredientName();
        }

        String currentName = ocrIngredient.getOcrIngredientName();
        if (!StringUtils.hasText(currentName)) {
            return "";
        }
        if (ingredientRepository.findByIngredientName(currentName).isPresent()) {
            return currentName;
        }

        return ingredientAliasRepository.findByNormalizedAliasName(IngredientAlias.normalize(currentName))
                .map(alias -> alias.getIngredient().getIngredientName())
                .orElse(currentName);
    }

    private String resolveOcrIngredientCategory(OcrIngredient ocrIngredient) {
        if (StringUtils.hasText(ocrIngredient.getCategory())) {
            return ocrIngredient.getCategory();
        }

        String normalizedName = resolveNormalizedOcrIngredientName(ocrIngredient);
        if (!StringUtils.hasText(normalizedName)) {
            return "기타";
        }

        return ingredientRepository.findByIngredientName(normalizedName)
                .map(Ingredient::getCategory)
                .or(() -> ingredientAliasRepository.findByNormalizedAliasName(IngredientAlias.normalize(normalizedName))
                        .map(alias -> alias.getIngredient().getCategory()))
                .filter(StringUtils::hasText)
                .orElse("기타");
    }

    public List<AdminDataStatisticsResponse> getDataStatistics(LocalDate startDate, LocalDate endDate) {
        try {
            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = endDate.atTime(LocalTime.MAX);

            List<UserIngredient> ingredients = userIngredientRepository.findAllByCreateTimeBetween(start, end);

            Map<LocalDate, Map<String, Long>> groupedData = ingredients.stream()
                    .collect(Collectors.groupingBy(
                            ui -> ui.getCreateTime().toLocalDate(),
                            Collectors.groupingBy(
                                    ui -> ui.getIngredient().getIngredientName(),
                                    Collectors.counting()
                            )
                    ));

            List<AdminDataStatisticsResponse> results = new ArrayList<>();

            groupedData.forEach((date, counts) -> {
                List<Map.Entry<String, Long>> sortedEntries = counts.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .collect(Collectors.toList());

                long dayTotal = counts.values().stream().mapToLong(Long::longValue).sum();

                results.add(AdminDataStatisticsResponse.builder()
                        .date(date)
                        .rank1(sortedEntries.size() > 0 ? List.of(sortedEntries.get(0).getKey(), sortedEntries.get(0).getValue()) : List.of("", 0L))
                        .rank2(sortedEntries.size() > 1 ? List.of(sortedEntries.get(1).getKey(), sortedEntries.get(1).getValue()) : List.of("", 0L))
                        .rank3(sortedEntries.size() > 2 ? List.of(sortedEntries.get(2).getKey(), sortedEntries.get(2).getValue()) : List.of("", 0L))
                        .total(dayTotal)
                        .build());
            });

            Collections.sort(results, (a, b) -> a.getDate().compareTo(b.getDate()));

            return results;
        } catch (Exception e) {
            throw new AdminException(AdminErrorCode.ADMIN_DATA_STATISTICS_ERROR);
        }
    }
}
