package com.connectgrs.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Expo Push Notification Service 클라이언트. ConnectRN(Expo managed)이 iOS/Android 공통으로
 * 발급받는 Expo push token 하나로 양쪽 플랫폼에 다 보낼 수 있어 별도 APNs/FCM 연동이 필요 없다.
 */
@Service
public class PushNotificationService {
    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    private static final URI EXPO_PUSH_ENDPOINT = URI.create("https://exp.host/--/api/v2/push/send");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public void send(String expoPushToken, String title, String body, Map<String, Object> data) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            return;
        }
        try {
            String json = toJson(expoPushToken, title, body, data);
            HttpRequest request = HttpRequest.newBuilder(EXPO_PUSH_ENDPOINT)
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .whenComplete((response, error) -> {
                        if (error != null) {
                            log.warn("Expo push send failed: {}", error.getMessage());
                        } else if (response.statusCode() >= 300) {
                            log.warn("Expo push send returned status {}: {}", response.statusCode(), response.body());
                        }
                    });
        } catch (Exception e) {
            log.warn("Expo push send failed to build request: {}", e.getMessage());
        }
    }

    private String toJson(String token, String title, String body, Map<String, Object> data) {
        StringBuilder dataJson = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!first) {
                dataJson.append(",");
            }
            first = false;
            dataJson.append('"').append(escape(entry.getKey())).append('"').append(':')
                    .append('"').append(escape(String.valueOf(entry.getValue()))).append('"');
        }
        dataJson.append("}");
        return "{"
                + "\"to\":\"" + escape(token) + "\","
                + "\"title\":\"" + escape(title) + "\","
                + "\"body\":\"" + escape(body) + "\","
                + "\"data\":" + dataJson
                + "}";
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
