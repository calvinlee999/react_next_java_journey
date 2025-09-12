package com.fintech.goldenpath.integration;

import com.fintech.goldenpath.BackendServiceApplication;
import com.fintech.goldenpath.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
    classes = BackendServiceApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
@DisplayName("Integration Tests for Golden Path Template")
class GoldenPathIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("Application should start successfully")
    void contextLoads() {
        // This test verifies that the Spring context loads successfully
        assertThat(port).isNotZero();
    }

    @Test
    @DisplayName("Health endpoint should be accessible")
    void healthEndpoint_ShouldBeAccessible() {
        String url = "http://localhost:" + port + "/api/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("UP");
        assertThat(response.getBody()).contains("Golden Path Backend");
    }

    @Test
    @DisplayName("Actuator health endpoint should be accessible")
    void actuatorHealthEndpoint_ShouldBeAccessible() {
        String url = "http://localhost:" + port + "/actuator/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("UP");
    }

    @Test
    @DisplayName("Info endpoint should return application information")
    void infoEndpoint_ShouldReturnAppInfo() {
        String url = "http://localhost:" + port + "/api/info";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Golden Path Template");
        assertThat(response.getBody()).contains("1.0.0");
    }

    @Test
    @DisplayName("Actuator info endpoint should be accessible")
    void actuatorInfoEndpoint_ShouldBeAccessible() {
        String url = "http://localhost:" + port + "/actuator/info";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Non-existent endpoint should return 404")
    void nonExistentEndpoint_ShouldReturn404() {
        String url = "http://localhost:" + port + "/api/nonexistent";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("CORS should be properly configured")
    void cors_ShouldBeProperlyConfigured() {
        String url = "http://localhost:" + port + "/api/health";
        
        // Create headers with Origin
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Origin", "http://localhost:3000");
        
        org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
        
        ResponseEntity<String> response = restTemplate.exchange(
            url, 
            org.springframework.http.HttpMethod.GET, 
            entity, 
            String.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getAccessControlAllowOrigin()).contains("http://localhost:3000");
    }
}
