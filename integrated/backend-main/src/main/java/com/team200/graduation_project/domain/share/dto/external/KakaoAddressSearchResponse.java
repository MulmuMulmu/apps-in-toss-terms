package com.team200.graduation_project.domain.share.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class KakaoAddressSearchResponse {

    private Meta meta;
    private List<Document> documents;

    public static KakaoAddressSearchResponse localFallback(String query) {
        KakaoAddressSearchResponse response = new KakaoAddressSearchResponse();
        Meta meta = new Meta();
        meta.totalCount = 1;

        Document document = new Document();
        document.addressName = "경기 성남시 수정구 " + (query == null || query.isBlank() ? "복정동" : query.trim());
        document.x = "127.126000";
        document.y = "37.461000";

        Address address = new Address();
        address.addressName = document.addressName;
        address.region3DepthName = query == null || query.isBlank() ? "복정동" : query.trim();
        document.address = address;

        response.meta = meta;
        response.documents = List.of(document);
        return response;
    }

    @Getter
    @NoArgsConstructor
    public static class Meta {
        @JsonProperty("total_count")
        private Integer totalCount;
    }

    @Getter
    @NoArgsConstructor
    public static class Document {
        @JsonProperty("address_name")
        private String addressName;
        private String x;
        private String y;
        private Address address;
    }

    @Getter
    @NoArgsConstructor
    public static class Address {
        @JsonProperty("address_name")
        private String addressName;
        @JsonProperty("region_1depth_name")
        private String region1DepthName;
        @JsonProperty("region_2depth_name")
        private String region2DepthName;
        @JsonProperty("region_3depth_name")
        private String region3DepthName;
        @JsonProperty("region_3depth_h_name")
        private String region3DepthHName;
    }
}
