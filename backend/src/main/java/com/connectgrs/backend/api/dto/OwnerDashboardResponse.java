package com.connectgrs.backend.api.dto;

import java.util.List;

public record OwnerDashboardResponse(
        String storeName,
        int weeklyRevenueManWon,
        int weeklyReservationCount,
        int pendingRequestCount,
        List<ReservationResponse> pendingRequests
) {
}
