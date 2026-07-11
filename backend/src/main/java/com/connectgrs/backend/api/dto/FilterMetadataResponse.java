package com.connectgrs.backend.api.dto;

import java.util.List;

public record FilterMetadataResponse(
        List<String> regions,
        List<String> categories,
        List<String> universities,
        List<String> timeOptions
) {
}
