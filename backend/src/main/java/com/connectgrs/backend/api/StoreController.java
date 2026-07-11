package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.StoreSummaryResponse;
import com.connectgrs.backend.service.ConnectService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final ConnectService connectService;

    public StoreController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @GetMapping("/stores/featured")
    public List<StoreSummaryResponse> getFeaturedStores(
            @RequestParam(required = false) UUID bookerId,
            @RequestParam(required = false) String region
    ) {
        return connectService.getFeaturedStores(bookerId, region);
    }

    @GetMapping("/stores")
    public List<StoreSummaryResponse> searchStores(
            @RequestParam(required = false) UUID bookerId,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer people,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) LocalTime time
    ) {
        return connectService.searchStores(bookerId, region, category, people, date, time);
    }

    @GetMapping("/stores/{storeId}")
    public StoreSummaryResponse getStore(
            @PathVariable UUID storeId,
            @RequestParam(required = false) UUID bookerId
    ) {
        return connectService.getStore(storeId, bookerId);
    }

    @GetMapping("/bookers/{bookerId}/favorites")
    public List<StoreSummaryResponse> getFavorites(@PathVariable UUID bookerId) {
        return connectService.getFavorites(bookerId);
    }

    @PostMapping("/bookers/{bookerId}/favorites/{storeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addFavorite(@PathVariable UUID bookerId, @PathVariable UUID storeId) {
        connectService.addFavorite(bookerId, storeId);
    }

    @DeleteMapping("/bookers/{bookerId}/favorites/{storeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(@PathVariable UUID bookerId, @PathVariable UUID storeId) {
        connectService.removeFavorite(bookerId, storeId);
    }
}
