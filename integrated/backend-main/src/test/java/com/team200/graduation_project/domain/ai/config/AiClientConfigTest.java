package com.team200.graduation_project.domain.ai.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class AiClientConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(AiClientConfig.class);

    @Test
    void prodProfileRequiresAiInternalToken() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "ai.internal-token="
                )
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void localProfileAllowsBlankAiInternalToken() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=local",
                        "ai.internal-token="
                )
                .run(context -> assertThat(context).hasNotFailed());
    }
}
