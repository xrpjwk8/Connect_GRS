package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerificationCodeRequest(
        @Email @NotBlank String email
) {
}
