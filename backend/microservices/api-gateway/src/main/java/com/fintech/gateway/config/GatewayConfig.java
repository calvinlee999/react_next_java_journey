package com.fintech.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import reactor.core.publisher.Mono;

/**
 * Gateway Routes Configuration
 * Defines routing rules with domain-based mapping, circuit breakers, and rate limiting
 */
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // User Service Routes
            .route("user-service", r -> r
                .host("users.fintech-local.com")
                .or()
                .path("/api/v1/users/**")
                .filters(f -> f
                    .circuitBreaker(config -> config
                        .setName("user-service-cb")
                        .setFallbackUri("forward:/fallback/users"))
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver()))
                    .retry(3))
                .uri("lb://user-service"))

            // AI Inference Service Routes
            .route("ai-inference-service", r -> r
                .host("ai.fintech-local.com")
                .or()
                .path("/api/v1/ai/**")
                .filters(f -> f
                    .circuitBreaker(config -> config
                        .setName("ai-service-cb")
                        .setFallbackUri("forward:/fallback/ai"))
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver()))
                    .retry(2))
                .uri("lb://ai-inference-service"))

            // Notification Service Routes
            .route("notification-service", r -> r
                .host("notifications.fintech-local.com")
                .or()
                .path("/api/v1/notifications/**")
                .filters(f -> f
                    .circuitBreaker(config -> config
                        .setName("notification-service-cb")
                        .setFallbackUri("forward:/fallback/notifications"))
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver())))
                .uri("lb://notification-service"))

            // Analytics Service Routes
            .route("analytics-service", r -> r
                .host("analytics.fintech-local.com")
                .or()
                .path("/api/v1/analytics/**")
                .filters(f -> f
                    .circuitBreaker(config -> config
                        .setName("analytics-service-cb")
                        .setFallbackUri("forward:/fallback/analytics"))
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver())))
                .uri("lb://analytics-service"))

            // WebSocket Routes for Real-time Communication
            .route("websocket-route", r -> r
                .path("/ws/**")
                .uri("lb://notification-service"))

            // Health Check Route
            .route("health-check", r -> r
                .path("/health/**")
                .filters(f -> f.stripPrefix(1))
                .uri("lb://api-gateway"))

            .build();
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        // Allow 10 requests per second with burst capacity of 20
        return new RedisRateLimiter(10, 20, 1);
    }

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Rate limit by user ID from JWT token or IP address as fallback
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-ID");
            if (userId != null) {
                return Mono.just(userId);
            }
            
            String clientIp = exchange.getRequest().getRemoteAddress() != null 
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
            return Mono.just(clientIp);
        };
    }
}