package com.team200.graduation_project.domain.user.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeNicknameRequest {
    private String oldnickName;
    private String newnickName;
}
