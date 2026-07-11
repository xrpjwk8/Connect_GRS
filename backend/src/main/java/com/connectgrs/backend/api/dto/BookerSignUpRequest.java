package com.connectgrs.backend.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record BookerSignUpRequest(
        @NotBlank String schoolName,
        @NotBlank String departmentName,
        @NotBlank String position,
        @NotBlank String realName,
        @Email @NotBlank String schoolEmail,
        @NotBlank String phoneNumber
) {
}
