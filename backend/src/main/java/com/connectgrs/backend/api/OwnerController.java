package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.AvailabilityResponse;
import com.connectgrs.backend.api.dto.OwnerDashboardResponse;
import com.connectgrs.backend.api.dto.ReservationResponse;
import com.connectgrs.backend.api.dto.TimeBlockUpdateRequest;
import com.connectgrs.backend.domain.ReservationStatus;
import com.connectgrs.backend.service.ConnectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/owners/{ownerId}")
public class OwnerController {
    private final ConnectService connectService;

    public OwnerController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @GetMapping("/dashboard")
    public OwnerDashboardResponse getDashboard(@PathVariable UUID ownerId) {
        return connectService.getOwnerDashboard(ownerId);
    }

    @PostMapping("/reservations/{reservationId}/approve")
    public ReservationResponse approve(@PathVariable UUID ownerId, @PathVariable UUID reservationId) {
        return connectService.updateReservationStatus(ownerId, reservationId, ReservationStatus.CONFIRMED);
    }

    @PostMapping("/reservations/{reservationId}/reject")
    public ReservationResponse reject(@PathVariable UUID ownerId, @PathVariable UUID reservationId) {
        return connectService.updateReservationStatus(ownerId, reservationId, ReservationStatus.REJECTED);
    }

    @GetMapping("/calendar")
    public Map<LocalDate, List<String>> getCalendar(
            @PathVariable UUID ownerId,
            @RequestParam UUID storeId,
            @RequestParam YearMonth yearMonth
    ) {
        return connectService.getCalendar(ownerId, storeId, yearMonth);
    }

    @GetMapping("/availability")
    public AvailabilityResponse getAvailability(
            @PathVariable UUID ownerId,
            @RequestParam UUID storeId,
            @RequestParam LocalDate date
    ) {
        return connectService.getAvailability(ownerId, storeId, date);
    }

    @PutMapping("/availability/blocks")
    public AvailabilityResponse replaceBlocks(
            @PathVariable UUID ownerId,
            @Valid @RequestBody TimeBlockUpdateRequest request
    ) {
        return connectService.replaceBlockedSlots(ownerId, request);
    }
}
