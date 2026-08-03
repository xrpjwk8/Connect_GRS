package com.connectgrs.backend.api.dto;

import com.connectgrs.backend.domain.Store;

import java.util.UUID;

public record AdminStoreResponse(
        UUID id,
        String name,
        String category,
        String region,
        UUID ownerId,
        String ownerName,
        double rating,
        int reviewCount,
        int maxCapacity,
        int pricePerPerson,
        int acceptanceRate
) {
    public static AdminStoreResponse from(Store store, String ownerName) {
        return new AdminStoreResponse(
                store.id(),
                store.name(),
                store.category(),
                store.region(),
                store.ownerId(),
                ownerName,
                store.rating(),
                store.reviewCount(),
                store.maxCapacity(),
                store.pricePerPerson(),
                store.acceptanceRate()
        );
    }
}
