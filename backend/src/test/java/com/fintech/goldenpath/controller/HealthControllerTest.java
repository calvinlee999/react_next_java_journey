package com.fintech.goldenpath.controller;

import com.fintech.goldenpath.BackendServiceApplication;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(classes = BackendServiceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Health Controller Tests")
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Health endpoint should return UP status")
    void healthEndpoint_ShouldReturnUpStatus() throws Exception {
        mockMvc.perform(get("/api/health")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", is("Golden Path Backend Service")))
                .andExpect(jsonPath("$.environment", is("development")))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("Info endpoint should return application information")
    void infoEndpoint_ShouldReturnApplicationInfo() throws Exception {
        mockMvc.perform(get("/api/info")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name", is("Golden Path Template")))
                .andExpect(jsonPath("$.description", containsString("Enterprise-grade")))
                .andExpect(jsonPath("$.version", is("1.0.0")))
                .andExpect(jsonPath("$.build.version", is("1.0.0")));
    }

    @Test
    @DisplayName("Status endpoint should return service status")
    void statusEndpoint_ShouldReturnServiceStatus() throws Exception {
        mockMvc.perform(get("/api/status")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", is("Golden Path Backend Service")))
                .andExpect(jsonPath("$.version", is("1.0.0")));
    }

    @Test
    @DisplayName("Health endpoint should handle CORS properly")
    void healthEndpoint_ShouldHandleCors() throws Exception {
        mockMvc.perform(get("/api/health")
                .header("Origin", "http://localhost:3000")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    @DisplayName("Non-existent endpoint should return 404")
    void nonExistentEndpoint_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/nonexistent")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
