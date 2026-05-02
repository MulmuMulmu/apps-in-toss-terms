package com.team200.graduation_project.domain.share.client;

import com.team200.graduation_project.domain.share.dto.external.KakaoAddressResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class KakaoLocalClientTest {

    @Test
    void coord2addressUsesLocalFallbackWhenKakaoKeyIsLocalPlaceholder() {
        KakaoLocalClient client = new KakaoLocalClient();
        ReflectionTestUtils.setField(client, "kakaoApiKey", "local-kakao-local-rest-api-key");

        KakaoAddressResponse response = client.coord2address(126.9780, 37.5665);

        assertThat(response.getDocuments()).hasSize(1);
        assertThat(response.getDocuments().get(0).getAddress().getAddressName())
                .isEqualTo("경기 성남시 수정구 복정동");
        assertThat(response.getDocuments().get(0).getAddress().getRegion3DepthName())
                .isEqualTo("복정동");
    }

    @Test
    void searchAddressUsesLocalFallbackWhenKakaoKeyIsLocalPlaceholder() {
        KakaoLocalClient client = new KakaoLocalClient();
        ReflectionTestUtils.setField(client, "kakaoApiKey", "local-kakao-local-rest-api-key");

        var response = client.searchAddress("복정동");

        assertThat(response.getDocuments()).hasSize(1);
        assertThat(response.getDocuments().get(0).getAddressName()).contains("복정동");
        assertThat(response.getDocuments().get(0).getX()).isNotBlank();
        assertThat(response.getDocuments().get(0).getY()).isNotBlank();
    }
}
