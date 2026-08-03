package com.connectgrs.backend.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessage(
        UUID id,
        UUID reservationId,
        UUID senderId,
        UserRole senderRole,
        String text,
        LocalDateTime createdAt
) {
}
