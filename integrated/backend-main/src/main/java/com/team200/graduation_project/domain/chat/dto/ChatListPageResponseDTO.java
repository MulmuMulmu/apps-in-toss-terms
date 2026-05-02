package com.team200.graduation_project.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ChatListPageResponseDTO {
    private List<ChatListItemDTO> items;
    private long totalCount;
    private int page;
    private int size;
    private boolean hasNext;
}
