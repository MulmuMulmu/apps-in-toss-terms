package com.team200.graduation_project.domain.chat.controller;

import com.team200.graduation_project.domain.chat.dto.*;
import com.team200.graduation_project.domain.chat.service.ChatService;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController implements ChatControllerDocs {

    private final ChatService chatService;

    @Override
    @PostMapping
    public ApiResponse<ChatStartResponseDTO> startChat(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatStartRequestDTO request
    ) {
        return ApiResponse.onSuccess(chatService.startChat(authorizationHeader, request));
    }

    @Override
    @PostMapping("/sending")
    public ApiResponse<String> sendMessage(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatMessageRequestDTO request
    ) {
        chatService.sendMessage(authorizationHeader, request);
        return ApiResponse.onSuccess("메시지가 성공적으로 전송되었습니다.");
    }

    @Override
    @GetMapping("/reception")
    public ApiResponse<List<ChatReceptionResponseDTO.MessageItemDTO>> getChatMessages(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID chatRoomId
    ) {
        return ApiResponse.onSuccess(chatService.getChatMessages(authorizationHeader, chatRoomId));
    }

    @GetMapping("/reception/page")
    public ApiResponse<ChatMessagePageResponseDTO> getChatMessagesPage(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam UUID chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ApiResponse.onSuccess(chatService.getChatMessagesPage(authorizationHeader, chatRoomId, page, size));
    }

    @Override
    @PatchMapping("/read")
    public ApiResponse<String> markAsRead(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatReadRequestDTO request
    ) {
        chatService.markAsRead(authorizationHeader, request);
        return ApiResponse.onSuccess("채팅방의 모든 메시지가 읽음 처리되었습니다.");
    }

    @Override
    @GetMapping("/list")
    public ApiResponse<List<ChatListItemDTO>> getChatList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam String type
    ) {
        return ApiResponse.onSuccess(chatService.getChatList(authorizationHeader, type));
    }

    @GetMapping("/list/page")
    public ApiResponse<ChatListPageResponseDTO> getChatListPage(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.onSuccess(chatService.getChatListPage(authorizationHeader, type, page, size));
    }

    @PostMapping("/report")
    public ApiResponse<String> reportChat(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatReportRequestDTO request
    ) {
        chatService.reportChat(authorizationHeader, request);
        return ApiResponse.onSuccess("채팅 신고가 접수되었습니다.");
    }

    @PostMapping("/block")
    public ApiResponse<String> blockChat(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatBlockRequestDTO request
    ) {
        chatService.blockChat(authorizationHeader, request);
        return ApiResponse.onSuccess("상대방을 차단했습니다.");
    }

    @DeleteMapping("/rooms/{chatRoomId}")
    public ApiResponse<String> deleteChatRoom(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable UUID chatRoomId
    ) {
        chatService.deleteChatRoom(authorizationHeader, chatRoomId);
        return ApiResponse.onSuccess("채팅방이 삭제되었습니다.");
    }

    @DeleteMapping("/rooms")
    public ApiResponse<String> deleteChatRooms(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatRoomDeleteRequestDTO request
    ) {
        chatService.deleteChatRooms(authorizationHeader, request);
        return ApiResponse.onSuccess("선택한 채팅방이 삭제되었습니다.");
    }
}
