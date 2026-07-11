package com.connectgrs.backend.domain;

import java.util.UUID;

public record BookerProfile(
        UUID id,
        String schoolName,
        String departmentName,
        String position,
        String realName,
        String schoolEmail,
        String phoneNumber
) {
}
