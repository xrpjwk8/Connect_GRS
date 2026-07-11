package com.connectgrs.backend.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record Reservation(
        UUID id,
        UUID storeId,
        UUID ownerId,
        UUID bookerId,
        String bookerName,
        String bookerAffiliation,
        LocalDate date,
        List<LocalTime> timeSlots,
        int people,
        Integer budgetPerPerson,
        String eventPurpose,
        String requestMessage,
        ReservationStatus status,
        LocalDateTime createdAt
) {
}
