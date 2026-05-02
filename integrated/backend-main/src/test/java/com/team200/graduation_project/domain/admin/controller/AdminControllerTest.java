package com.team200.graduation_project.domain.admin.controller;

import com.team200.graduation_project.domain.admin.service.AdminService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @Test
    void updateOcrIngredientsWrapsServiceResultWithBackendEnvelope() throws Exception {
        Mockito.when(adminService.updateOcrIngredients(any()))
                .thenReturn("OCR 품목이 수정 완료되었습니다.");

        mockMvc.perform(patch("/admin/ocr/ingredients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "ocrId": "11111111-1111-1111-1111-111111111111",
                                  "accuracy": 96.5,
                                  "items": [
                                    {
                                      "ocrIngredientId": "22222222-2222-2222-2222-222222222222",
                                      "itemName": "우유",
                                      "quantity": 1
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result").value("OCR 품목이 수정 완료되었습니다."));
    }

    @Test
    void addIngredientAliasWrapsServiceResultWithBackendEnvelope() throws Exception {
        Mockito.when(adminService.addIngredientAlias(any()))
                .thenReturn("식재료 별칭이 성공적으로 등록되었습니다.");

        mockMvc.perform(post("/admin/ingredient/alias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "aliasName": "맛있는우유GT",
                                  "ingredientName": "우유",
                                  "source": "admin_review"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result").value("식재료 별칭이 성공적으로 등록되었습니다."));
    }
}
