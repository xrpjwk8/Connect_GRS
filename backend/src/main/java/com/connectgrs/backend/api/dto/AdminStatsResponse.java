package com.connectgrs.backend.api.dto;

public record AdminStatsResponse(
        int storeCount,
        int ownerCount,
        int bookerCount,
        int reservationCount,
        int pendingCount,
        int confirmedCount,
        int registeredDeviceCount
) {
}
