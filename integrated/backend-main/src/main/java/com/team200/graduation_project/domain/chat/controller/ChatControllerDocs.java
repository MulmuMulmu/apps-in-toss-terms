package com.team200.graduation_project.domain.chat.controller;

import com.team200.graduation_project.domain.chat.dto.*;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestHeader;

@Tag(name = "Chat", description = "채팅 도메인 API")
public interface ChatControllerDocs {

    @Operation(summary = "채팅 시작", description = "나눔 게시글을 통해 채팅방을 생성하거나 기존의 채팅방 ID를 반환합니다. 당근마켓처럼 게시글 하나당 채팅방 하나가 매칭됩니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": {
                        "chatRoomId": "UUID-example-1234-5678"
                      }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (본인 게시글에 채팅 등)", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON400",
                      "result": "잘못된 요청입니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "게시글을 찾을 수 없음", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "SHARE404",
                      "result": "나눔 게시글을 찾을 수 없습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "채팅 시작 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "채팅을 시작할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<ChatStartResponseDTO> startChat(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = true, content = @Content(schema = @Schema(implementation = ChatStartRequestDTO.class), examples = @ExampleObject(value = """
                    {
                      "postId": "UUID-post-id-1234"
                    }
                    """))) ChatStartRequestDTO request
    );

    @Operation(summary = "채팅 메시지 전송", description = "특정 채팅방에 메시지를 전송합니다. 본인이 해당 채팅방의 참여자(개설자 또는 수신자)여야 합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "메시지가 성공적으로 전송되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (참여자가 아님)", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "AUTH403",
                      "result": "권한이 없습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "채팅방을 찾을 수 없음", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON404",
                      "result": "리소스를 찾을 수 없습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "전송 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "메시지를 전송할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> sendMessage(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = true, content = @Content(schema = @Schema(implementation = ChatMessageRequestDTO.class), examples = @ExampleObject(value = """
                    {
                      "chatRoomId": "UUID-chatroom-id-1234",
                      "content": "안녕하세요~ 나눔 받고 싶습니다."
                    }
                    """))) ChatMessageRequestDTO request
    );

    @Operation(summary = "채팅 내역 조회", description = "특정 채팅방의 모든 메시지 내역을 시간순으로 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChatReceptionResponseDTO.class), examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": [
                        {
                          "messageId": "exampleMessageId1",
                          "senderNicName": "익명1",
                          "content": "네, 오늘 오후 6시에 판교역 1번 출구 가능하신가요?",
                          "sendTime": "2026-04-08T09:30:15",
                          "isRead": true
                        },
                        {
                          "messageId": "exampleMessageId2",
                          "senderNicName": "익명2",
                          "content": "좋습니다! 그때 뵐게요.",
                          "sendTime": "2026-04-08T09:35:00",
                          "isRead": false
                        }
                      ]
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "조회 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "메시지를 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<java.util.List<ChatReceptionResponseDTO.MessageItemDTO>> getChatMessages(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "채팅방 ID") @org.springframework.web.bind.annotation.RequestParam java.util.UUID chatRoomId
    );

    @Operation(summary = "채팅 읽음 처리", description = "특정 채팅방에서 상대방이 보낸 모든 메시지를 읽음 상태로 변경합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": "채팅방의 모든 메시지가 읽음 처리되었습니다."
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "처리 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "읽음 처리를 완료할 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<String> markAsRead(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = true, content = @Content(schema = @Schema(implementation = ChatReadRequestDTO.class), examples = @ExampleObject(value = """
                    {
                      "chatRoomId": "UUID-chatroom-id-1234"
                    }
                    """))) ChatReadRequestDTO request
    );

    @Operation(summary = "채팅방 목록 조회", description = "내가 참여 중인 채팅방 목록을 조회합니다. 필터 유형(all, give, take)에 따라 조회가 가능합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ChatListItemDTO.class)), examples = @ExampleObject(value = """
                    {
                      "success": true,
                      "result": [
                        {
                          "senderNicName": "익명1",
                          "lastMessage": "안녕하세요~",
                          "sendTime": "2026-04-08T09:30:15",
                          "type": "give"
                        },
                        {
                          "senderNicName": "익명2",
                          "lastMessage": "좋습니다! 그때 뵐게요.",
                          "sendTime": "2026-04-08T09:35:00",
                          "type": "take"
                        }
                      ]
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "조회 실패", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                    {
                      "success": false,
                      "code": "COMMON500",
                      "result": "채팅방들을 불러올 수 없습니다."
                    }
                    """)))
    })
    ApiResponse<java.util.List<ChatListItemDTO>> getChatList(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authorizationHeader,
            @Parameter(description = "조회 유형 (all, give, take)") @org.springframework.web.bind.annotation.RequestParam String type
    );
}
