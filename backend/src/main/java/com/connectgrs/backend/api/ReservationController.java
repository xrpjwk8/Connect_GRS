package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.ReservationCreateRequest;
import com.connectgrs.backend.api.dto.ReservationResponse;
import com.connectgrs.backend.api.dto.ReservationUpdateRequest;
import com.connectgrs.backend.service.ConnectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReservationController {
    private final ConnectService connectService;

    public ReservationController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @PostMapping("/reservations")
    public ReservationResponse createReservation(@Valid @RequestBody ReservationCreateRequest request) {
        return connectService.createReservation(request);
    }

    @GetMapping("/bookers/{bookerId}/reservations")
    public List<ReservationResponse> getReservations(
            @PathVariable UUID bookerId,
            @RequestParam(required = false) String statusGroup
    ) {
        return connectService.getReservationsForBooker(bookerId, statusGroup);
    }

    @PatchMapping("/reservations/{reservationId}")
    public ReservationResponse updateReservation(
            @PathVariable UUID reservationId,
            @Valid @RequestBody ReservationUpdateRequest request
    ) {
        return connectService.updateReservation(reservationId, request);
    }

    @PostMapping("/reservations/{reservationId}/cancel")
    public ReservationResponse cancelReservation(@PathVariable UUID reservationId) {
        return connectService.cancelReservation(reservationId);
    }
}
