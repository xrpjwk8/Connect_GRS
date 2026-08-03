package com.connectgrs.backend.api.dto;

import com.connectgrs.backend.domain.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DeviceRegisterRequest(
        @NotNull UUID userId,
        @NotNull UserRole role,
        @NotBlank String expoPushToken
) {
}
