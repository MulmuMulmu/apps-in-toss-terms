package com.team200.graduation_project.domain.share.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class KakaoAddressResponse {

    private Meta meta;
    private List<Document> documents;

    public static KakaoAddressResponse localFallback() {
        KakaoAddressResponse response = new KakaoAddressResponse();
        Meta meta = new Meta();
        meta.totalCount = 1;

        Address address = new Address();
        address.addressName = "경기 성남시 수정구 복정동";
        address.region3DepthName = "복정동";

        Document document = new Document();
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
        private Address address;
        @JsonProperty("road_address")
        private RoadAddress roadAddress;
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
        @JsonProperty("h_code")
        private String hCode;
        @JsonProperty("b_code")
        private String bCode;
        @JsonProperty("mountain_yn")
        private String mountainYn;
        @JsonProperty("main_address_no")
        private String mainAddressNo;
        @JsonProperty("sub_address_no")
        private String subAddressNo;
        @JsonProperty("zip_code")
        private String zipCode;
    }

    @Getter
    @NoArgsConstructor
    public static class RoadAddress {
        @JsonProperty("address_name")
        private String addressName;
        @JsonProperty("region_1depth_name")
        private String region1DepthName;
        @JsonProperty("region_2depth_name")
        private String region2DepthName;
        @JsonProperty("region_3depth_name")
        private String region3DepthName;
        @JsonProperty("road_name")
        private String roadName;
        @JsonProperty("underground_yn")
        private String undergroundYn;
        @JsonProperty("main_building_no")
        private String mainBuildingNo;
        @JsonProperty("sub_building_no")
        private String subBuildingNo;
        @JsonProperty("building_name")
        private String buildingName;
        @JsonProperty("zone_no")
        private String zoneNo;
    }
}
