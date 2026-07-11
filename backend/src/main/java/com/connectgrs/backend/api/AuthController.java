package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.BookerSignUpRequest;
import com.connectgrs.backend.api.dto.OwnerSignUpRequest;
import com.connectgrs.backend.domain.BookerProfile;
import com.connectgrs.backend.domain.OwnerProfile;
import com.connectgrs.backend.service.ConnectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final ConnectService connectService;

    public AuthController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @PostMapping("/bookers")
    public BookerProfile signUpBooker(@Valid @RequestBody BookerSignUpRequest request) {
        return connectService.createBooker(request);
    }

    @PostMapping("/owners")
    public OwnerProfile signUpOwner(@Valid @RequestBody OwnerSignUpRequest request) {
        return connectService.createOwner(request);
    }
}
