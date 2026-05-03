package com.team200.graduation_project.domain.share.controller;

import com.team200.graduation_project.domain.share.dto.response.LocationResponse;
import com.team200.graduation_project.domain.share.dto.response.LocationSearchResponse;
import com.team200.graduation_project.domain.share.service.ShareService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ShareController.class)
@AutoConfigureMockMvc(addFilters = false)
class ShareControllerAliasTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ShareService shareService;

    @Test
    void gpsLocationAliasUsesLocationService() throws Exception {
        Mockito.doReturn(new LocationResponse("서울 중구 태평로1가 31", "태평로1가", 37.5665, 126.9780))
                .when(shareService)
                .addLocation(eq("Bearer token"), any());

        mockMvc.perform(post("/share/adding/location/gps")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 37.5665,
                                  "longitude": 126.9780
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result.display_address").value("태평로1가"));
    }

    @Test
    void locationSearchReturnsAdministrativeCandidates() throws Exception {
        Mockito.doReturn(List.of(LocationSearchResponse.builder()
                        .full_address("경기 성남시 수정구 복정동")
                        .display_address("복정동")
                        .latitude(37.4610)
                        .longitude(127.1260)
                        .build()))
                .when(shareService)
                .searchLocations("복정동");

        mockMvc.perform(get("/share/location/search")
                        .header("Authorization", "Bearer token")
                        .param("query", "복정동"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result[0].display_address").value("복정동"))
                .andExpect(jsonPath("$.result[0].latitude").value(37.4610))
                .andExpect(jsonPath("$.result[0].longitude").value(127.1260));
    }

    @Test
    void myLocationReturnsSavedShareLocation() throws Exception {
        Mockito.doReturn(new LocationResponse("경기 성남시 수정구 복정동", "복정동", 37.4610, 127.1260))
                .when(shareService)
                .getMyLocation("Bearer token");

        mockMvc.perform(get("/share/location/me")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result.full_address").value("경기 성남시 수정구 복정동"))
                .andExpect(jsonPath("$.result.display_address").value("복정동"));
    }

    @Test
    void kakaoLocationAliasUsesLocationService() throws Exception {
        Mockito.doReturn(new LocationResponse("서울 중구 태평로1가 31", "태평로1가", 37.5665, 126.9780))
                .when(shareService)
                .addLocation(eq("Bearer token"), any());

        mockMvc.perform(post("/share/adding/location/kakao")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 37.5665,
                                  "longitude": 126.9780
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postingListAliasUsesShareListService() throws Exception {
        Mockito.doReturn(null).when(shareService).getShareList("Bearer token", 20.0, 1, 5);

        mockMvc.perform(get("/share/posting/list")
                        .header("Authorization", "Bearer token")
                        .param("radiusKm", "20")
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postingDetailAliasUsesShareDetailService() throws Exception {
        UUID postId = UUID.randomUUID();
        Mockito.doReturn(null).when(shareService).getShareDetail("Bearer token", postId);

        mockMvc.perform(get("/share/posting/list/one")
                        .header("Authorization", "Bearer token")
                        .param("postId", postId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postingMyAliasesUseExistingMyShareServices() throws Exception {
        UUID postId = UUID.randomUUID();
        Mockito.doReturn(List.of()).when(shareService).getMyShareList("Bearer token", "나눔 중");

        mockMvc.perform(get("/share/posting/list/my")
                        .header("Authorization", "Bearer token")
                        .param("type", "나눔 중"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(put("/share/posting/list/my")
                        .header("Authorization", "Bearer token")
                        .param("postId", postId.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(delete("/share/posting/list/my")
                        .header("Authorization", "Bearer token")
                        .param("postId", postId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
