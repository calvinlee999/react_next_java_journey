package com.fintech.goldenpath.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/hello")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class HelloController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> hello() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello from Golden Path Backend!");
        response.put("service", "Fintech Backend Service");
        response.put("version", "1.0.0");
        response.put("architecture", "React + Java + Azure");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/secure")
    public ResponseEntity<Map<String, String>> secureHello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello from Secure Endpoint!");
        response.put("note", "This endpoint requires authentication");
        return ResponseEntity.ok(response);
    }
}
