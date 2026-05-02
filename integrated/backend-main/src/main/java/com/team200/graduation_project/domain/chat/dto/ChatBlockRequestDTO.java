package com.team200.graduation_project.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ChatBlockRequestDTO {
    private UUID chatRoomId;
}
