package com.connectgrs.backend.domain;

import java.util.List;
import java.util.UUID;

public record Store(
        UUID id,
        UUID ownerId,
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
        List<String> keywords
) {
}
