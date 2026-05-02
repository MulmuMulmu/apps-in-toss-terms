package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.ChatBlock;
import com.team200.graduation_project.domain.share.entity.ChatRoom;
import com.team200.graduation_project.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChatBlockRepository extends JpaRepository<ChatBlock, UUID> {
    boolean existsByChatRoomAndBlockerAndBlocked(ChatRoom chatRoom, User blocker, User blocked);
    boolean existsByChatRoomAndBlockerAndBlockedOrChatRoomAndBlockerAndBlocked(
            ChatRoom chatRoom1, User blocker1, User blocked1,
            ChatRoom chatRoom2, User blocker2, User blocked2
    );
}
