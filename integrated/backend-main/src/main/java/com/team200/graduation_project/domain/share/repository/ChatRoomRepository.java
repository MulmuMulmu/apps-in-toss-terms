package com.team200.graduation_project.domain.share.repository;

import com.team200.graduation_project.domain.share.entity.ChatRoom;
import com.team200.graduation_project.domain.share.entity.Share;
import com.team200.graduation_project.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    Optional<ChatRoom> findByShareAndSender(Share share, User sender);
    List<ChatRoom> findAllBySender(User sender);
    List<ChatRoom> findAllByShare_User(User user);
}
