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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class AppsInTossLoginHttpClient implements AppsInTossLoginClient {

    private final ObjectMapper objectMapper;

    @Value("${apps-in-toss.login.base-url:https://apps-in-toss-api.toss.im}")
    private String baseUrl;

    @Value("${apps-in-toss.login.token-path:/api-partner/v1/apps-in-toss/user/oauth2/generate-token}")
    private String tokenPath;

    @Value("${apps-in-toss.login.user-info-path:/api-partner/v1/apps-in-toss/user/oauth2/login-me}")
    private String userInfoPath;

    @Value("${apps-in-toss.login.mtls.enabled:false}")
    private boolean mtlsEnabled;

    @Value("${apps-in-toss.login.mtls.cert-path:}")
    private String certPath;

    @Value("${apps-in-toss.login.mtls.key-path:}")
    private String keyPath;

    @Override
    public AppsInTossUserInfo login(String authorizationCode, String referrer) {
        try {
            String accessToken = requestAccessToken(authorizationCode, referrer);
            return requestUserInfo(accessToken);
        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
    }

    private String requestAccessToken(String authorizationCode, String referrer) throws IOException, InterruptedException {
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
        Object token = response.getOrDefault("accessToken", response.get("access_token"));
        if (!StringUtils.hasText(token == null ? null : token.toString())) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        return token.toString();
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
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        return objectMapper.readValue(response.body(), new TypeReference<>() {});
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapSuccess(Map<String, Object> response) {
        if ("FAIL".equals(response.get("resultType"))) {
            throw new UserException(UserErrorCode.USER_LOGIN_FAILED);
        }
        Object success = response.get("success");
        if (success instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return response;
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
