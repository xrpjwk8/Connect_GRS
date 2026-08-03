package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.AdminStatsResponse;
import com.connectgrs.backend.api.dto.AdminStoreResponse;
import com.connectgrs.backend.api.dto.ReservationResponse;
import com.connectgrs.backend.domain.BookerProfile;
import com.connectgrs.backend.domain.OwnerProfile;
import com.connectgrs.backend.domain.ReservationStatus;
import com.connectgrs.backend.service.ConnectService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * 운영자 전용 조회/관리 API. 나머지 백엔드와 마찬가지로 별도 인증은 없음(로컬/사내 운영 도구 전제).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ConnectService connectService;

    public AdminController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return connectService.getAdminStats();
    }

    @GetMapping("/stores")
    public List<AdminStoreResponse> getStores() {
        return connectService.getAllStoresForAdmin();
    }

    @GetMapping("/owners")
    public List<OwnerProfile> getOwners() {
        return connectService.getAllOwners();
    }

    @GetMapping("/bookers")
    public List<BookerProfile> getBookers() {
        return connectService.getAllBookers();
    }

    @GetMapping("/reservations")
    public List<ReservationResponse> getReservations(@RequestParam(required = false) String statusGroup) {
        return connectService.getAllReservationsForAdmin(statusGroup);
    }

    @PostMapping("/reservations/{reservationId}/status")
    public ReservationResponse updateReservationStatus(
            @PathVariable UUID reservationId,
            @RequestParam ReservationStatus status
    ) {
        return connectService.adminUpdateReservationStatus(reservationId, status);
    }
}
