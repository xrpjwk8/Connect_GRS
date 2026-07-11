package com.connectgrs.backend.api.dto;

import com.connectgrs.backend.domain.Store;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record StoreSummaryResponse(
        UUID id,
        String name,
        String category,
        double rating,
        int reviewCount,
        int maxCapacity,
        int pricePerPerson,
        int acceptanceRate,
        String region,
        String description,
        String imageName,
        List<String> keywords,
        boolean favorite
) {
    public static StoreSummaryResponse from(Store store, Set<UUID> favoriteStoreIds) {
        return new StoreSummaryResponse(
                store.id(),
                store.name(),
                store.category(),
                store.rating(),
                store.reviewCount(),
                store.maxCapacity(),
                store.pricePerPerson(),
                store.acceptanceRate(),
                store.region(),
                store.description(),
                store.imageName(),
                store.keywords(),
                favoriteStoreIds.contains(store.id())
        );
    }
}
