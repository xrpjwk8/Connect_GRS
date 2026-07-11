package com.connectgrs.backend.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AvailabilityResponse(
        LocalDate date,
        List<SlotState> slots
) {
    public record SlotState(LocalTime time, String state) {
    }
}
