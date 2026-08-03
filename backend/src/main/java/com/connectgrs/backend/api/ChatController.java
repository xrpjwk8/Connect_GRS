package com.connectgrs.backend.api;

import com.connectgrs.backend.api.dto.ChatMessageCreateRequest;
import com.connectgrs.backend.api.dto.ChatMessageResponse;
import com.connectgrs.backend.service.ConnectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations/{reservationId}/messages")
public class ChatController {
    private final ConnectService connectService;

    public ChatController(ConnectService connectService) {
        this.connectService = connectService;
    }

    @GetMapping
    public List<ChatMessageResponse> getMessages(@PathVariable UUID reservationId) {
        return connectService.getMessages(reservationId);
    }

    @PostMapping
    public ChatMessageResponse postMessage(
            @PathVariable UUID reservationId,
            @Valid @RequestBody ChatMessageCreateRequest request
    ) {
        return connectService.postMessage(reservationId, request);
    }
}
