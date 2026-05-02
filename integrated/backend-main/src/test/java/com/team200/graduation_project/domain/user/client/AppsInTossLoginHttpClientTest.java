package com.team200.graduation_project.domain.user.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AppsInTossLoginHttpClientTest {

    private HttpServer server;
    private String baseUrl;
    private final AtomicReference<String> tokenRequestBody = new AtomicReference<>();
    private final AtomicReference<String> tokenContentType = new AtomicReference<>();

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/api-partner/v1/apps-in-toss/user/oauth2/generate-token", this::handleToken);
        server.createContext("/api-partner/v1/apps-in-toss/user/oauth2/login-me", this::handleUserInfo);
        server.start();
        baseUrl = "http://localhost:" + server.getAddress().getPort();
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void loginUsesAppsInTossGenerateTokenContractAndReturnsUserInfo() {
        AppsInTossLoginHttpClient client = new AppsInTossLoginHttpClient(new ObjectMapper());
        ReflectionTestUtils.setField(client, "baseUrl", baseUrl);
        ReflectionTestUtils.setField(client, "tokenPath", "/api-partner/v1/apps-in-toss/user/oauth2/generate-token");
        ReflectionTestUtils.setField(client, "userInfoPath", "/api-partner/v1/apps-in-toss/user/oauth2/login-me");
        ReflectionTestUtils.setField(client, "mtlsEnabled", false);

        AppsInTossUserInfo result = client.login("auth-code", "SANDBOX");

        assertThat(result.userKey()).isEqualTo("443731104");
        assertThat(result.scope()).isEqualTo("user_name,user_gender");
        assertThat(result.agreedTerms()).containsExactly("service_terms", "marketing_optional");
        assertThat(tokenContentType.get()).contains("application/json");
        assertThat(tokenRequestBody.get()).contains("\"authorizationCode\":\"auth-code\"");
        assertThat(tokenRequestBody.get()).contains("\"referrer\":\"SANDBOX\"");
    }

    private void handleToken(HttpExchange exchange) throws IOException {
        tokenContentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
        tokenRequestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        byte[] response = """
                {
                  "resultType": "SUCCESS",
                  "success": {
                    "accessToken": "access-token",
                    "refreshToken": "refresh-token",
                    "scope": "user_name,user_gender"
                  }
                }
                """.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.length);
        exchange.getResponseBody().write(response);
        exchange.close();
    }

    private void handleUserInfo(HttpExchange exchange) throws IOException {
        byte[] response = """
                {
                  "resultType": "SUCCESS",
                  "success": {
                    "userKey": 443731104,
                    "scope": "user_name,user_gender",
                    "agreedTerms": ["service_terms", "marketing_optional"]
                  }
                }
                """.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.length);
        exchange.getResponseBody().write(response);
        exchange.close();
    }
}
