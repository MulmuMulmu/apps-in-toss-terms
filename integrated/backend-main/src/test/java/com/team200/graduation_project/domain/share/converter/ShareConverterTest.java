package com.team200.graduation_project.domain.share.converter;

import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.UserIngredient;
import com.team200.graduation_project.domain.share.dto.response.MyShareItemDTO;
import com.team200.graduation_project.domain.share.dto.response.ShareDetailResponseDTO;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.user.entity.Location;
import com.team200.graduation_project.domain.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShareConverterTest {

    private final ShareConverter shareConverter = new ShareConverter();

    @Test
    void shareDetailIncludesPosterLocation() {
        User user = User.builder().userId("seller").nickName("나연").build();
        Share share = Share.builder()
                .user(user)
                .userIngredient(UserIngredient.builder()
                        .ingredient(Ingredient.builder().ingredientName("양파").category("채소/과일").build())
                        .build())
                .title("양파 나눔")
                .category("채소/과일")
                .content("서초동 나눔")
                .build();
        Location location = Location.builder()
                .user(user)
                .displayAddress("서초동")
                .latitude(37.4979)
                .longitude(127.0276)
                .build();

        ShareDetailResponseDTO response = shareConverter.toShareDetailResponse(share, null, location);

        assertThat(response.getLocationName()).isEqualTo("서초동");
        assertThat(response.getLatitude()).isEqualTo(37.4979);
        assertThat(response.getLongitude()).isEqualTo(127.0276);
    }

    @Test
    void myShareItemIncludesPosterLocation() {
        User user = User.builder().userId("seller").nickName("나연").build();
        Share share = Share.builder()
                .user(user)
                .userIngredient(UserIngredient.builder()
                        .ingredient(Ingredient.builder().ingredientName("콩나물").category("채소/과일").build())
                        .build())
                .title("콩나물 나눔")
                .category("채소/과일")
                .content("서초동 나눔")
                .build();
        Location location = Location.builder()
                .user(user)
                .displayAddress("서초동")
                .latitude(37.4979)
                .longitude(127.0276)
                .build();

        MyShareItemDTO response = shareConverter.toMyShareItemDTO(share, null, location);

        assertThat(response.getLocationName()).isEqualTo("서초동");
        assertThat(response.getLatitude()).isEqualTo(37.4979);
        assertThat(response.getLongitude()).isEqualTo(127.0276);
    }
}
