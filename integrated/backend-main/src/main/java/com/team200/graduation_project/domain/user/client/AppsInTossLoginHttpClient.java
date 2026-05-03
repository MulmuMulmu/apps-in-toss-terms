package com.team200.graduation_project.domain.user.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team200.graduation_project.domain.user.exception.UserErrorCode;
import com.team200.graduation_project.domain.user.exception.UserException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppsInTossLoginHttpClient implements AppsInTossLoginClient, AppsInTossAccessRemovalClient {

    private final ObjectMapper objectMapper;

    @Value("${apps-in-toss.login.base-url:https://apps-in-toss-api.toss.im}")
    private String baseUrl;

    @Value("${apps-in-toss.login.token-path:/api-partner/v1/apps-in-toss/user/oauth2/generate-token}")
    private String tokenPath;

    @Value("${apps-in-toss.login.user-info-path:/api-partner/v1/apps-in-toss/user/oauth2/login-me}")
    private String userInfoPath;

    @Value("${apps-in-toss.login.refresh-token-path:/api-partner/v1/apps-in-toss/user/oauth2/refresh-token}")
    private String refreshTokenPath;

    @Value("${apps-in-toss.login.remove-by-user-key-path:/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key}")
    private String removeByUserKeyPath;

    @Value("${apps-in-toss.login.mtls.enabled:false}")
    private boolean mtlsEnabled;

    @Value("${apps-in-toss.login.mtls.cert-path:}")
    private String certPath;

    @Value("${apps-in-toss.login.mtls.key-path:}")
    private String keyPath;

    @Override
    public AppsInTossUserInfo login(String authorizationCode, String referrer) {
        try {
            AppsInTossToken token = requestAccessToken(authorizationCode, referrer);
            AppsInTossUserInfo userInfo = requestUserInfo(token.accessToken());
            return new AppsInTossUserInfo(
                    userInfo.userKey(),
                    userInfo.scope(),
                    userInfo.agreedTerms(),
                    token.accessToken(),
                    token.refreshToken(),
                    token.expiresIn()
            );
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            log.warn("AppsInToss login failed while calling partner API: {}", e.getClass().getSimpleName());
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
    }

    @Override
    public AppsInTossToken refreshToken(String refreshToken) {
        try {
            String body = objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken));
            HttpRequest request = HttpRequest.newBuilder(uri(refreshTokenPath))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            return parseTokenResponse(unwrapSuccess(send(request)));
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            log.warn("AppsInToss token refresh failed while calling partner API: {}", e.getClass().getSimpleName());
            throw new UserException(UserErrorCode.USER_DELETION_FAILED);
        }
    }

    @Override
    public void removeByUserKey(String accessToken, String userKey) {
        try {
            String body = objectMapper.writeValueAsString(Map.of("userKey", userKey));
            HttpRequest request = HttpRequest.newBuilder(uri(removeByUserKeyPath))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + accessToken)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            unwrapSuccess(send(request));
        } catch (UserException e) {
            throw new UserException(UserErrorCode.USER_DELETION_FAILED);
        } catch (Exception e) {
            log.warn("AppsInToss unlink failed while calling partner API: {}", e.getClass().getSimpleName());
            throw new UserException(UserErrorCode.USER_DELETION_FAILED);
        }
    }

    private AppsInTossToken requestAccessToken(String authorizationCode, String referrer) throws IOException, InterruptedException {
        String body = objectMapper.writeValueAsString(Map.of(
                "authorizationCode", authorizationCode,
                "referrer", referrer
        ));

        HttpRequest request = HttpRequest.newBuilder(uri(tokenPath))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        Map<String, Object> response = unwrapSuccess(send(request));
        return parseTokenResponse(response);
    }

    private AppsInTossToken parseTokenResponse(Map<String, Object> response) {
        Object accessToken = response.getOrDefault("accessToken", response.get("access_token"));
        if (!StringUtils.hasText(accessToken == null ? null : accessToken.toString())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        Object refreshToken = response.getOrDefault("refreshToken", response.get("refresh_token"));
        Object expiresIn = response.getOrDefault("expiresIn", response.get("expires_in"));
        return new AppsInTossToken(
                accessToken.toString(),
                refreshToken == null ? "" : refreshToken.toString(),
                parseLong(expiresIn)
        );
    }

    private AppsInTossUserInfo requestUserInfo(String accessToken) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri(userInfoPath))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        Map<String, Object> response = unwrapSuccess(send(request));
        Object userKey = response.get("userKey");
        if (userKey == null || !StringUtils.hasText(userKey.toString())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        String scope = response.get("scope") == null ? "" : response.get("scope").toString();
        List<String> agreedTerms = parseStringList(response.get("agreedTerms"));
        return new AppsInTossUserInfo(userKey.toString(), scope, agreedTerms);
    }

    private Map<String, Object> send(HttpRequest request) throws IOException, InterruptedException {
        HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.warn(
                    "AppsInToss API returned non-success status. path={}, status={}, error={}",
                    request.uri().getPath(),
                    response.statusCode(),
                    summarizeTossError(response.body())
            );
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        return objectMapper.readValue(response.body(), new TypeReference<>() {});
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapSuccess(Map<String, Object> response) {
        if ("FAIL".equals(response.get("resultType"))) {
            Object error = response.get("error");
            log.warn("AppsInToss API returned FAIL. error={}", summarizeTossError(error));
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        Object success = response.get("success");
        if (success instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return response;
    }

    @SuppressWarnings("unchecked")
    private String summarizeTossError(Object value) {
        try {
            Object parsed = value;
            if (value instanceof String text && StringUtils.hasText(text)) {
                parsed = objectMapper.readValue(text, new TypeReference<Map<String, Object>>() {});
            }
            if (parsed instanceof Map<?, ?> map) {
                Object directError = map.get("error");
                if (directError instanceof Map<?, ?> errorMap) {
                    Object code = firstPresent(errorMap, "errorCode", "error");
                    Object reason = firstPresent(errorMap, "reason", "error_description");
                    return "code=" + safeValue(code) + ", reason=" + safeValue(reason);
                }
                Object code = firstPresent(map, "errorCode", "error");
                Object reason = firstPresent(map, "reason", "error_description");
                return "code=" + safeValue(code) + ", reason=" + safeValue(reason);
            }
        } catch (Exception ignored) {
            return "unparseable";
        }
        return "empty";
    }

    private Object firstPresent(Map<?, ?> map, String firstKey, String secondKey) {
        Object value = map.get(firstKey);
        return value != null ? value : map.get(secondKey);
    }

    private String safeValue(Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        return text.length() > 120 ? text.substring(0, 120) : text;
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private URI uri(String path) {
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return URI.create(normalizedBase + normalizedPath);
    }

    private HttpClient httpClient() {
        HttpClient.Builder builder = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5));
        if (mtlsEnabled) {
            builder.sslContext(buildMtlsContext());
        }
        return builder.build();
    }

    private SSLContext buildMtlsContext() {
        try {
            requireConfigured(certPath, "apps-in-toss.login.mtls.cert-path");
            requireConfigured(keyPath, "apps-in-toss.login.mtls.key-path");

            X509Certificate certificate = (X509Certificate) CertificateFactory.getInstance("X.509")
                    .generateCertificate(Files.newInputStream(Path.of(certPath)));
            PrivateKey privateKey = parsePrivateKey(Files.readString(Path.of(keyPath), StandardCharsets.UTF_8));

            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(null, null);
            keyStore.setKeyEntry("apps-in-toss-login", privateKey, new char[0], new X509Certificate[]{certificate});

            KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            keyManagerFactory.init(keyStore, new char[0]);

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(keyManagerFactory.getKeyManagers(), null, new SecureRandom());
            return sslContext;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
    }

    private PrivateKey parsePrivateKey(String pem) throws Exception {
        String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(normalized);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    private void requireConfigured(String value, String propertyName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(propertyName + " is required");
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(Object::toString)
                    .toList();
        }
        return List.of();
    }
}
