package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.ChatMessage;
import com.team200.graduation_project.domain.share.entity.ChatRoom;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findAllByChatRoom_ChatRoomIdOrderByCreateTimeAsc(UUID chatRoomId);

    Optional<ChatMessage> findFirstByChatRoomOrderByCreateTimeDesc(ChatRoom chatRoom);

    Optional<ChatMessage> findFirstByChatRoom_ChatRoomIdOrderByCreateTimeDesc(UUID chatRoomId);

    Optional<ChatMessage> findFirstByChatRoom_ChatRoomIdAndCreateTimeAfterOrderByCreateTimeDesc(UUID chatRoomId, LocalDateTime createTime);

    Page<ChatMessage> findByChatRoom_ChatRoomIdOrderByCreateTimeDesc(UUID chatRoomId, Pageable pageable);

    Page<ChatMessage> findByChatRoom_ChatRoomIdAndCreateTimeAfterOrderByCreateTimeDesc(UUID chatRoomId, LocalDateTime createTime, Pageable pageable);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.chatRoom.chatRoomId = :chatRoomId AND m.user.userId != :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("chatRoomId") UUID chatRoomId, @Param("userId") String userId);
}
