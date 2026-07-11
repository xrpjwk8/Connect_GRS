package com.connectgrs.backend.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record TimeBlock(
        UUID id,
        UUID ownerId,
        UUID storeId,
        LocalDate date,
        LocalTime time,
        String reason
) {
}
