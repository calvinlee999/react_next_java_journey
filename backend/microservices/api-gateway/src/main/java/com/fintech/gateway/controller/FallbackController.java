package com.fintech.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Fallback Controller for Circuit Breaker patterns
 * Provides graceful degradation when services are unavailable
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    // Constants for common field names
    private static final String ERROR_FIELD = "error";
    private static final String MESSAGE_FIELD = "message";
    private static final String TIMESTAMP_FIELD = "timestamp";
    private static final String SERVICE_FIELD = "service";
    
    // Service identifiers
    private static final String USER_SERVICE = "user-service";
    private static final String AI_INFERENCE_SERVICE = "ai-inference-service";
    private static final String NOTIFICATION_SERVICE = "notification-service";
    private static final String ANALYTICS_SERVICE = "analytics-service";

    @GetMapping("/users")
    public Mono<ResponseEntity<Map<String, Object>>> userServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                ERROR_FIELD, "User service is temporarily unavailable",
                MESSAGE_FIELD, "Please try again later",
                TIMESTAMP_FIELD, LocalDateTime.now(),
                SERVICE_FIELD, USER_SERVICE
            )));
    }

    @GetMapping("/ai")
    public Mono<ResponseEntity<Map<String, Object>>> aiServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                ERROR_FIELD, "AI service is temporarily unavailable",
                MESSAGE_FIELD, "AI inference is currently offline. Please try again later.",
                TIMESTAMP_FIELD, LocalDateTime.now(),
                SERVICE_FIELD, AI_INFERENCE_SERVICE,
                "fallback_response", "I'm sorry, I'm currently unable to process your request due to high demand. Please try again in a few moments."
            )));
    }

    @GetMapping("/notifications")
    public Mono<ResponseEntity<Map<String, Object>>> notificationServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                ERROR_FIELD, "Notification service is temporarily unavailable",
                MESSAGE_FIELD, "Notifications will be queued and delivered when service is restored",
                TIMESTAMP_FIELD, LocalDateTime.now(),
                SERVICE_FIELD, NOTIFICATION_SERVICE
            )));
    }

    @GetMapping("/analytics")
    public Mono<ResponseEntity<Map<String, Object>>> analyticsServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                ERROR_FIELD, "Analytics service is temporarily unavailable",
                MESSAGE_FIELD, "Analytics data collection is paused. Data will be available once service is restored.",
                TIMESTAMP_FIELD, LocalDateTime.now(),
                SERVICE_FIELD, ANALYTICS_SERVICE
            )));
    }
}