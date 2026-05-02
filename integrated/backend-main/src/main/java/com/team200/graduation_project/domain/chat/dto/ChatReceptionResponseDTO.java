package com.team200.graduation_project.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReceptionResponseDTO {
    private List<MessageItemDTO> messages;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItemDTO {
        private UUID messageId;
        private String senderNicName;
        private String content;
        private String sendTime;
        private Boolean isRead;
    }
}
