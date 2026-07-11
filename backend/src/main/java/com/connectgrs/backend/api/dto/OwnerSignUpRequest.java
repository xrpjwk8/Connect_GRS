package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OwnerSignUpRequest(
        @NotBlank @Size(max = 20) String storeName,
        @NotBlank String ownerName,
        @NotBlank String contact,
        @NotBlank String businessNumber
) {
}
