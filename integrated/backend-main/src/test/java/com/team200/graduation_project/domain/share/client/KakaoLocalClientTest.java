package com.team200.graduation_project.domain.share.client;

import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KakaoLocalClientTest {

    @Test
    void coord2addressRejectsLocalPlaceholderKeyInsteadOfReturningFakeNeighborhood() {
        KakaoLocalClient client = new KakaoLocalClient();
        ReflectionTestUtils.setField(client, "kakaoApiKey", "local-kakao-local-rest-api-key");

        assertThatThrownBy(() -> client.coord2address(126.9780, 37.5665))
                .isInstanceOf(GeneralException.class);
    }

    @Test
    void searchAddressRejectsLocalPlaceholderKeyInsteadOfReturningFakeNeighborhood() {
        KakaoLocalClient client = new KakaoLocalClient();
        ReflectionTestUtils.setField(client, "kakaoApiKey", "local-kakao-local-rest-api-key");

        assertThatThrownBy(() -> client.searchAddress("서정동"))
                .isInstanceOf(GeneralException.class);
    }

    @Test
    void coord2addressRejectsWhitespaceOnlyKey() {
        KakaoLocalClient client = new KakaoLocalClient();
        ReflectionTestUtils.setField(client, "kakaoApiKey", " \n ");

        assertThatThrownBy(() -> client.coord2address(127.0600, 37.0660))
                .isInstanceOf(GeneralException.class);
    }
}
