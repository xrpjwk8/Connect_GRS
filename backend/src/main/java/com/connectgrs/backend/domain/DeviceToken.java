package com.connectgrs.backend.domain;

import java.util.UUID;

public record DeviceToken(
        UUID userId,
        UserRole role,
        String expoPushToken
) {
}
