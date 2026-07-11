package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ReservationUpdateRequest(
        @NotNull LocalDate date,
        @NotEmpty List<LocalTime> timeSlots,
        @Min(1) int people,
        Integer budgetPerPerson,
        String eventPurpose,
        String requestMessage
) {
}
