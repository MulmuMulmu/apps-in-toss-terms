package com.team200.graduation_project.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDeleteRequestDTO {
    private List<UUID> chatRoomIds;
}
