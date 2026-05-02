package com.team200.graduation_project.domain.share.entity;

import com.team200.graduation_project.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "`ChatRoom`")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID chatRoomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shareId")
    private Share share;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senderId")
    private User sender;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private LocalDateTime senderClearedAt;

    private LocalDateTime receiverClearedAt;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public void clearFor(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (sender != null && sender.getUserId().equals(user.getUserId())) {
            senderClearedAt = now;
        } else {
            receiverClearedAt = now;
        }
    }

    public LocalDateTime clearedAtFor(User user) {
        if (sender != null && sender.getUserId().equals(user.getUserId())) {
            return senderClearedAt;
        }
        return receiverClearedAt;
    }
}
