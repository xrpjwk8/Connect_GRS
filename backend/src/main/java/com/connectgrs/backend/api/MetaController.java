package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.FilterMetadataResponse;
import com.connectgrs.backend.service.ConnectService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meta")
public class MetaController {
    private final ConnectService connectService;

    public MetaController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @GetMapping("/filters")
    public FilterMetadataResponse getFilters() {
        return connectService.getMetadata();
    }
}
