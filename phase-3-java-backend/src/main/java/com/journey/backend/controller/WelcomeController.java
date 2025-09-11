package com.journey.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class WelcomeController {

    @GetMapping("/welcome")
    public Map<String, Object> welcome() {
        return Map.of(
            "message", "Welcome to Java Backend Learning!",
            "phase", "Phase 3",
            "technology", "Spring Boot",
            "description", "Build robust server-side applications with Java",
            "features", new String[]{
                "RESTful API Development",
                "Database Integration with JPA",
                "Security with JWT",
                "Comprehensive Testing",
                "Production-Ready Deployment"
            }
        );
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "message", "Backend service is running successfully!"
        );
    }
}