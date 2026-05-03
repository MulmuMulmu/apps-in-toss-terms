package com.team200.graduation_project.domain.share.client;

import com.team200.graduation_project.domain.share.dto.external.KakaoAddressResponse;
import com.team200.graduation_project.domain.share.dto.external.KakaoAddressSearchResponse;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class KakaoLocalClient {

    private static final String KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/geo/coord2address.json";
    private static final String KAKAO_ADDRESS_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/address.json";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.api.key}")
    private String kakaoApiKey;

    public KakaoAddressResponse coord2address(Double longitude, Double latitude) {
        String apiKey = normalizeKakaoApiKey();

        URI uri = UriComponentsBuilder
                .fromUriString(KAKAO_LOCAL_URL)
                .queryParam("x", longitude)
                .queryParam("y", latitude)
                .encode()
                .build()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + apiKey);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<KakaoAddressResponse> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    KakaoAddressResponse.class
            );
            return response.getBody();
        } catch (RestClientException e) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }
    }

    public KakaoAddressSearchResponse searchAddress(String query) {
        String apiKey = normalizeKakaoApiKey();

        URI uri = UriComponentsBuilder
                .fromUriString(KAKAO_ADDRESS_SEARCH_URL)
                .queryParam("query", query)
                .queryParam("size", 10)
                .encode()
                .build()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + apiKey);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<KakaoAddressSearchResponse> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    KakaoAddressSearchResponse.class
            );
            return response.getBody();
        } catch (RestClientException e) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }
    }

    private String normalizeKakaoApiKey() {
        String apiKey = kakaoApiKey == null ? "" : kakaoApiKey.trim();
        if (apiKey.isBlank() || apiKey.startsWith("local-")) {
            throw new GeneralException(GeneralErrorCode.LOCATION_FETCH_FAILED);
        }
        return apiKey;
    }
}
