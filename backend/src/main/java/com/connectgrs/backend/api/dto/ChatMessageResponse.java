package com.connectgrs.backend.api.dto;

import com.connectgrs.backend.domain.ChatMessage;
import com.connectgrs.backend.domain.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        UUID reservationId,
        UUID senderId,
        UserRole senderRole,
        String text,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.id(),
                message.reservationId(),
                message.senderId(),
                message.senderRole(),
                message.text(),
                message.createdAt()
        );
    }
}
