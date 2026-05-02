package com.team200.graduation_project.domain.chat.service;

import com.team200.graduation_project.domain.chat.converter.ChatConverter;
import com.team200.graduation_project.domain.chat.dto.*;
import com.team200.graduation_project.domain.share.entity.ChatBlock;
import com.team200.graduation_project.domain.share.entity.ChatMessage;
import com.team200.graduation_project.domain.share.entity.ChatRoom;
import com.team200.graduation_project.domain.share.entity.ChatRoomParticipant;
import com.team200.graduation_project.domain.share.entity.ChatRoomParticipantId;
import com.team200.graduation_project.domain.share.entity.Report;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.share.exception.ShareErrorCode;
import com.team200.graduation_project.domain.share.exception.ShareException;
import com.team200.graduation_project.domain.share.repository.ChatBlockRepository;
import com.team200.graduation_project.domain.share.repository.ChatMessageRepository;
import com.team200.graduation_project.domain.share.repository.ChatRoomParticipantRepository;
import com.team200.graduation_project.domain.share.repository.ChatRoomRepository;
import com.team200.graduation_project.domain.share.repository.ReportRepository;
import com.team200.graduation_project.domain.share.repository.ShareRepository;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.code.GeneralErrorCode;
import com.team200.graduation_project.global.apiPayload.exception.GeneralException;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomParticipantRepository chatRoomParticipantRepository;
    private final ChatBlockRepository chatBlockRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ShareRepository shareRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final ChatConverter chatConverter;

    @Transactional
    public ChatStartResponseDTO startChat(String authorizationHeader, ChatStartRequestDTO request) {
        User sender = findUserFromHeader(authorizationHeader);

        Share share = shareRepository.findById(request.getPostId())
                .orElseThrow(() -> new ShareException(ShareErrorCode.SHARE_POSTING_NOT_FOUND));

        if (share.getUser().getUserId().equals(sender.getUserId())) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        Optional<ChatRoom> existingRoom = chatRoomRepository.findByShareAndSender(share, sender);
        if (existingRoom.isPresent()) {
            if (isBlocked(existingRoom.get(), sender, share.getUser())) {
                throw new GeneralException(GeneralErrorCode.FORBIDDEN);
            }
            return chatConverter.toChatStartResponseDTO(existingRoom.get());
        }

        try {
            ChatRoom chatRoom = ChatRoom.builder()
                    .share(share)
                    .sender(sender)
                    .build();
            chatRoom = chatRoomRepository.save(chatRoom);

            ChatRoomParticipant participant = ChatRoomParticipant.builder()
                    .chatRoomId(chatRoom.getChatRoomId())
                    .receiverId(share.getUser().getUserId())
                    .build();
            chatRoomParticipantRepository.save(participant);

            return chatConverter.toChatStartResponseDTO(chatRoom);
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatListItemDTO> getChatList(String authorizationHeader, String type) {
        User user = findUserFromHeader(authorizationHeader);

        List<ChatListItemDTO> resultList = new ArrayList<>();

        if ("all".equalsIgnoreCase(type) || "take".equalsIgnoreCase(type)) {
            List<ChatRoom> takeRooms = chatRoomRepository.findAllBySender(user);
            takeRooms.forEach(room -> {
                ChatMessage lastMsg = findLastVisibleMessage(room, user);
                if (lastMsg == null && room.clearedAtFor(user) != null) {
                    return;
                }
                User opponent = room.getShare().getUser();
                resultList.add(chatConverter.toChatListItemDTO(room, lastMsg, "take", opponent));
            });
        }

        if ("all".equalsIgnoreCase(type) || "give".equalsIgnoreCase(type)) {
            List<ChatRoom> giveRooms = chatRoomRepository.findAllByShare_User(user);
            giveRooms.forEach(room -> {
                ChatMessage lastMsg = findLastVisibleMessage(room, user);
                if (lastMsg == null && room.clearedAtFor(user) != null) {
                    return;
                }
                User opponent = room.getSender();
                resultList.add(chatConverter.toChatListItemDTO(room, lastMsg, "give", opponent));
            });
        }

        resultList.sort((a, b) -> b.getSendTime().compareTo(a.getSendTime()));

        return resultList;
    }

    @Transactional(readOnly = true)
    public ChatListPageResponseDTO getChatListPage(String authorizationHeader, String type, int page, int size) {
        validatePage(page, size);
        List<ChatListItemDTO> allItems = getChatList(authorizationHeader, type);
        int fromIndex = Math.min(page * size, allItems.size());
        int toIndex = Math.min(fromIndex + size, allItems.size());

        return ChatListPageResponseDTO.builder()
                .items(allItems.subList(fromIndex, toIndex))
                .totalCount(allItems.size())
                .page(page)
                .size(size)
                .hasNext(toIndex < allItems.size())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ChatReceptionResponseDTO.MessageItemDTO> getChatMessages(String authorizationHeader, UUID chatRoomId) {
        User user = findUserFromHeader(authorizationHeader);
        String userId = user.getUserId();

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        boolean isInitiator = chatRoom.getSender().getUserId().equals(userId);
        boolean isReceiver = chatRoomParticipantRepository.existsById(new ChatRoomParticipantId(chatRoomId, userId));

        if (!isInitiator && !isReceiver) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }

        List<ChatMessage> messages = visibleMessagesFor(chatRoom, user);

        return messages.stream()
                .map(chatConverter::toMessageItemDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatMessagePageResponseDTO getChatMessagesPage(String authorizationHeader, UUID chatRoomId, int page, int size) {
        validatePage(page, size);
        User user = findUserFromHeader(authorizationHeader);
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        validateParticipant(chatRoom, user);

        LocalDateTime clearedAt = chatRoom.clearedAtFor(user);
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ChatMessage> messagePage = clearedAt == null
                ? chatMessageRepository.findByChatRoom_ChatRoomIdOrderByCreateTimeDesc(chatRoomId, pageRequest)
                : chatMessageRepository.findByChatRoom_ChatRoomIdAndCreateTimeAfterOrderByCreateTimeDesc(chatRoomId, clearedAt, pageRequest);

        List<ChatReceptionResponseDTO.MessageItemDTO> items = new ArrayList<>(
                messagePage.getContent().stream()
                        .map(chatConverter::toMessageItemDTO)
                        .toList()
        );
        Collections.reverse(items);

        return ChatMessagePageResponseDTO.builder()
                .items(items)
                .totalCount((int) messagePage.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(messagePage.hasNext())
                .build();
    }

    @Transactional
    public void sendMessage(String authorizationHeader, ChatMessageRequestDTO request) {
        User sender = findUserFromHeader(authorizationHeader);
        String senderId = sender.getUserId();

        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        boolean isInitiator = chatRoom.getSender().getUserId().equals(senderId);
        boolean isReceiver = chatRoomParticipantRepository.existsById(new ChatRoomParticipantId(request.getChatRoomId(), senderId));

        if (!isInitiator && !isReceiver) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        User opponent = findOpponent(chatRoom, sender);
        if (isBlocked(chatRoom, sender, opponent)) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }

        try {
            ChatMessage message = ChatMessage.builder()
                    .user(sender)
                    .chatRoom(chatRoom)
                    .type("TALK")
                    .detailMessage(request.getContent())
                    .build();
            chatMessageRepository.save(message);
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public void reportChat(String authorizationHeader, ChatReportRequestDTO request) {
        if (request == null || request.getChatRoomId() == null || !StringUtils.hasText(request.getReason())) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        User reporter = findUserFromHeader(authorizationHeader);
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        String reporterId = reporter.getUserId();
        boolean isInitiator = chatRoom.getSender().getUserId().equals(reporterId);
        boolean isReceiver = chatRoomParticipantRepository.existsById(new ChatRoomParticipantId(request.getChatRoomId(), reporterId));

        if (!isInitiator && !isReceiver) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }

        String reportedMessage = "";
        if (request.getMessageId() != null) {
            ChatMessage message = chatMessageRepository.findById(request.getMessageId())
                    .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
            if (!message.getChatRoom().getChatRoomId().equals(request.getChatRoomId())) {
                throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
            }
            reportedMessage = "\n신고 메시지: " + message.getDetailMessage();
        }

        String detail = StringUtils.hasText(request.getContent()) ? request.getContent().trim() : "상세 내용 없음";
        Report report = Report.builder()
                .reporter(reporter)
                .share(chatRoom.getShare())
                .title("채팅 신고 - " + request.getReason().trim())
                .content("채팅방 ID: " + request.getChatRoomId()
                        + "\n사유: " + request.getReason().trim()
                        + reportedMessage
                        + "\n내용: " + detail)
                .build();
        reportRepository.save(report);
    }

    @Transactional
    public void blockChat(String authorizationHeader, ChatBlockRequestDTO request) {
        if (request == null || request.getChatRoomId() == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        User blocker = findUserFromHeader(authorizationHeader);
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        validateParticipant(chatRoom, blocker);
        User blocked = findOpponent(chatRoom, blocker);

        if (!chatBlockRepository.existsByChatRoomAndBlockerAndBlocked(chatRoom, blocker, blocked)) {
            chatBlockRepository.save(ChatBlock.builder()
                    .chatRoom(chatRoom)
                    .blocker(blocker)
                    .blocked(blocked)
                    .build());
        }
    }

    @Transactional
    public void deleteChatRoom(String authorizationHeader, UUID chatRoomId) {
        User user = findUserFromHeader(authorizationHeader);
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        validateParticipant(chatRoom, user);
        chatRoom.clearFor(user);
        chatRoomRepository.save(chatRoom);
    }

    @Transactional
    public void deleteChatRooms(String authorizationHeader, ChatRoomDeleteRequestDTO request) {
        if (request == null || request.getChatRoomIds() == null || request.getChatRoomIds().isEmpty()) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
        request.getChatRoomIds().forEach(chatRoomId -> deleteChatRoom(authorizationHeader, chatRoomId));
    }

    @Transactional
    public void markAsRead(String authorizationHeader, ChatReadRequestDTO request) {
        User user = findUserFromHeader(authorizationHeader);
        String userId = user.getUserId();
        UUID chatRoomId = request.getChatRoomId();

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        boolean isInitiator = chatRoom.getSender().getUserId().equals(userId);
        boolean isReceiver = chatRoomParticipantRepository.existsById(new ChatRoomParticipantId(chatRoomId, userId));

        if (!isInitiator && !isReceiver) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }

        try {
            chatMessageRepository.markMessagesAsRead(chatRoomId, userId);
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private User findUserFromHeader(String authorizationHeader) {
        String token = extractAccessToken(authorizationHeader);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        String userId = jwtTokenProvider.getSubject(token);
        return userRepository.findByUserIdIsAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.UNAUTHORIZED));
    }

    private String extractAccessToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        String bearerPrefix = "Bearer ";
        if (authorizationHeader.startsWith(bearerPrefix)) {
            return authorizationHeader.substring(bearerPrefix.length()).trim();
        }
        return authorizationHeader.trim();
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new GeneralException(GeneralErrorCode.INVALID_REQUEST_ARGUMENT);
        }
    }

    private void validateParticipant(ChatRoom chatRoom, User user) {
        boolean isInitiator = chatRoom.getSender().getUserId().equals(user.getUserId());
        boolean isReceiver = chatRoomParticipantRepository.existsById(new ChatRoomParticipantId(chatRoom.getChatRoomId(), user.getUserId()));
        if (!isInitiator && !isReceiver) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
    }

    private User findOpponent(ChatRoom chatRoom, User user) {
        if (chatRoom.getSender().getUserId().equals(user.getUserId())) {
            return chatRoom.getShare().getUser();
        }
        return chatRoom.getSender();
    }

    private boolean isBlocked(ChatRoom chatRoom, User currentUser, User opponent) {
        return chatBlockRepository.existsByChatRoomAndBlockerAndBlockedOrChatRoomAndBlockerAndBlocked(
                chatRoom, currentUser, opponent,
                chatRoom, opponent, currentUser
        );
    }

    private ChatMessage findLastVisibleMessage(ChatRoom chatRoom, User user) {
        LocalDateTime clearedAt = chatRoom.clearedAtFor(user);
        return clearedAt == null
                ? chatMessageRepository.findFirstByChatRoom_ChatRoomIdOrderByCreateTimeDesc(chatRoom.getChatRoomId()).orElse(null)
                : chatMessageRepository.findFirstByChatRoom_ChatRoomIdAndCreateTimeAfterOrderByCreateTimeDesc(
                        chatRoom.getChatRoomId(),
                        clearedAt
                ).orElse(null);
    }

    private List<ChatMessage> visibleMessagesFor(ChatRoom chatRoom, User user) {
        LocalDateTime clearedAt = chatRoom.clearedAtFor(user);
        return chatMessageRepository.findAllByChatRoom_ChatRoomIdOrderByCreateTimeAsc(chatRoom.getChatRoomId()).stream()
                .filter(message -> clearedAt == null || message.getCreateTime().isAfter(clearedAt))
                .toList();
    }
}
