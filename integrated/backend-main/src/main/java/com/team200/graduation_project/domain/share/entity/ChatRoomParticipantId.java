package com.team200.graduation_project.domain.share.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ChatRoomParticipantId implements Serializable {
    private UUID chatRoomId;
    private String receiverId;
}
