package com.team200.graduation_project.domain.chat.converter;

import com.team200.graduation_project.domain.chat.dto.ChatListItemDTO;
import com.team200.graduation_project.domain.chat.dto.ChatReceptionResponseDTO;
import com.team200.graduation_project.domain.chat.dto.ChatStartResponseDTO;
import com.team200.graduation_project.domain.share.entity.ChatMessage;
import com.team200.graduation_project.domain.share.entity.ChatRoom;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class ChatConverter {
    public ChatStartResponseDTO toChatStartResponseDTO(ChatRoom chatRoom) {
        return ChatStartResponseDTO.builder()
                .chatRoomId(chatRoom.getChatRoomId())
                .build();
    }

    public ChatReceptionResponseDTO.MessageItemDTO toMessageItemDTO(ChatMessage chatMessage) {
        return ChatReceptionResponseDTO.MessageItemDTO.builder()
                .messageId(chatMessage.getChatMessageId())
                .senderId(chatMessage.getUser().getUserId())
                .senderNicName(chatMessage.getUser().getNickName())
                .content(chatMessage.getDetailMessage())
                .sendTime(chatMessage.getCreateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .isRead(chatMessage.getIsRead())
                .build();
    }

    public ChatListItemDTO toChatListItemDTO(ChatRoom chatRoom, ChatMessage lastMessage, String type, User opponent) {
        String nickname = (opponent.getStatus() == UserStatus.WITHDRAWN || opponent.getStatus() == UserStatus.BLOCKED) 
                ? "존재하지 않는 사용자" : opponent.getNickName();

        return ChatListItemDTO.builder()
                .chatRoomId(chatRoom.getChatRoomId())
                .postId(chatRoom.getShare().getShareId())
                .opponentId(opponent.getUserId())
                .senderNicName(nickname)
                .lastMessage(lastMessage != null ? lastMessage.getDetailMessage() : "")
                .sendTime(lastMessage != null ? lastMessage.getCreateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "")
                .type(type)
                .build();
    }
}
