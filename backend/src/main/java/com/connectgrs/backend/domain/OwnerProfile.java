package com.connectgrs.backend.domain;

import java.util.UUID;

public record OwnerProfile(
        UUID id,
        String storeName,
        String ownerName,
        String contact,
        String businessNumber,
        UUID storeId
) {
}
