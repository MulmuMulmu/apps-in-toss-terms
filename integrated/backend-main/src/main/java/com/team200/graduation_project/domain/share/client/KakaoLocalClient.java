package com.team200.graduation_project.domain.share.client;

import com.team200.graduation_project.domain.share.dto.external.KakaoAddressResponse;
import com.team200.graduation_project.domain.share.dto.external.KakaoAddressSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class KakaoLocalClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.api.key}")
    private String kakaoApiKey;

    private static final String KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/geo/coord2address.json";
    private static final String KAKAO_ADDRESS_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/address.json";

    public KakaoAddressResponse coord2address(Double longitude, Double latitude) {
        if (isLocalPlaceholderKey()) {
            return KakaoAddressResponse.localFallback();
        }

        URI uri = UriComponentsBuilder
                .fromUriString(KAKAO_LOCAL_URL)
                .queryParam("x", longitude)
                .queryParam("y", latitude)
                .encode()
                .build()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoApiKey);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<KakaoAddressResponse> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                entity,
                KakaoAddressResponse.class
        );

        return response.getBody();
    }

    public KakaoAddressSearchResponse searchAddress(String query) {
        if (isLocalPlaceholderKey()) {
            return KakaoAddressSearchResponse.localFallback(query);
        }

        URI uri = UriComponentsBuilder
                .fromUriString(KAKAO_ADDRESS_SEARCH_URL)
                .queryParam("query", query)
                .queryParam("size", 10)
                .encode()
                .build()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoApiKey);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<KakaoAddressSearchResponse> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                entity,
                KakaoAddressSearchResponse.class
        );

        return response.getBody();
    }

    private boolean isLocalPlaceholderKey() {
        return kakaoApiKey == null
                || kakaoApiKey.isBlank()
                || kakaoApiKey.startsWith("local-");
    }
}
