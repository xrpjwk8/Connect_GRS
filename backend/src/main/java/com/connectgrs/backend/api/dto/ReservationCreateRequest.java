package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ReservationCreateRequest(
        @NotNull UUID storeId,
        @NotNull UUID bookerId,
        @NotNull LocalDate date,
        @NotEmpty List<LocalTime> timeSlots,
        @Min(1) int people,
        Integer budgetPerPerson,
        @NotBlank String eventPurpose,
        String requestMessage
) {
}
