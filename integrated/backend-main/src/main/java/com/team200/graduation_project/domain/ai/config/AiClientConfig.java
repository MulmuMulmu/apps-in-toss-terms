package com.team200.graduation_project.domain.ai.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(30));
        return new RestTemplate(requestFactory);
    }

    @Bean
    @Profile("prod")
    AiInternalTokenProductionGuard aiInternalTokenProductionGuard(
            @Value("${ai.internal-token:}") String internalToken
    ) {
        if (!StringUtils.hasText(internalToken)) {
            throw new IllegalStateException("AI_INTERNAL_TOKEN must be configured when the prod profile is active.");
        }
        return new AiInternalTokenProductionGuard();
    }

    static class AiInternalTokenProductionGuard {
    }
}
