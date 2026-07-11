package com.connectgrs.backend.api.dto;

import com.connectgrs.backend.domain.Reservation;
import com.connectgrs.backend.domain.Store;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID storeId,
        String storeName,
        String imageName,
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
        String status,
        LocalDateTime createdAt
) {
    public static ReservationResponse from(Reservation reservation, Store store) {
        return new ReservationResponse(
                reservation.id(),
                reservation.storeId(),
                store.name(),
                store.imageName(),
                reservation.ownerId(),
                reservation.bookerId(),
                reservation.bookerName(),
                reservation.bookerAffiliation(),
                reservation.date(),
                reservation.timeSlots(),
                reservation.people(),
                reservation.budgetPerPerson(),
                reservation.eventPurpose(),
                reservation.requestMessage(),
                reservation.status().name(),
                reservation.createdAt()
        );
    }
}
