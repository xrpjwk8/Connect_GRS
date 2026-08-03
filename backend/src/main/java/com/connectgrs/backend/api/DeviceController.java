package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.DeviceRegisterRequest;
import com.connectgrs.backend.service.ConnectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    private final ConnectService connectService;

    public DeviceController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@Valid @RequestBody DeviceRegisterRequest request) {
        connectService.registerDevice(request);
    }
}
