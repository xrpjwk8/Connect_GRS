package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TimeBlockUpdateRequest(
        @NotNull UUID storeId,
        @NotNull LocalDate date,
        @NotEmpty List<LocalTime> blockedSlots
) {
}
