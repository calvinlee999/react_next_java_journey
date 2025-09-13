package com.fintech.batch.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintech.batch.BatchInferenceApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Batch Inference Service
 * 
 * Tests the full service integration including:
 * - API endpoints
 * - Service health
 * - Model registry integration
 * - Basic job submission
 */
@SpringBootTest(
    classes = BatchInferenceApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("test")
@AutoConfigureWebMvc
public class BatchInferenceServiceIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String getBaseUrl() {
        return "http://localhost:" + port + "/batch-inference/api/v1/batch-inference";
    }

    @Test
    public void testServiceHealth() {
        // Test health endpoint
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/health", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
    }

    @Test
    public void testGetAvailableModels() {
        // Test models endpoint
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/models", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsKey("models");
        assertThat(response.getBody()).containsKey("totalModels");
    }

    @Test
    public void testGetModelInfo() {
        // Test specific model info endpoint
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/models/credit-risk-model", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("modelName")).isEqualTo("credit-risk-model");
        assertThat(response.getBody()).containsKey("version");
        assertThat(response.getBody()).containsKey("stage");
    }

    @Test
    public void testSubmitBatchJob() {
        // Test job submission endpoint
        Map<String, Object> jobRequest = Map.of(
            "modelType", "credit-risk",
            "batchSize", 1000,
            "description", "Test batch job"
        );

        ResponseEntity<Map> response = restTemplate.postForEntity(
            getBaseUrl() + "/jobs", jobRequest, Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsKey("jobId");
        assertThat(response.getBody().get("status")).isEqualTo("SUBMITTED");
        assertThat(response.getBody().get("message"))
            .isEqualTo("Batch inference job submitted successfully");
    }

    @Test
    public void testGetStorageMetrics() {
        // Test storage metrics endpoint
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/metrics/storage", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsKey("totalDataGB");
        assertThat(response.getBody()).containsKey("historicalDataGB");
        assertThat(response.getBody()).containsKey("lastUpdated");
    }

    @Test
    public void testClearModelCache() {
        // Test model cache clear endpoint
        ResponseEntity<Map> response = restTemplate.postForEntity(
            getBaseUrl() + "/models/cache/clear", null, Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("message"))
            .isEqualTo("Model cache cleared successfully");
        assertThat(response.getBody()).containsKey("timestamp");
    }

    @Test
    public void testArchiveOldData() {
        // Test data archival endpoint
        ResponseEntity<Map> response = restTemplate.postForEntity(
            getBaseUrl() + "/data/archive?retentionDays=7", null, Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("message"))
            .isEqualTo("Data archival completed successfully");
        assertThat(response.getBody().get("retentionDays")).isEqualTo(7);
    }

    @Test
    public void testNonExistentModel() {
        // Test behavior with non-existent model
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/models/non-existent-model", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    public void testHealthContainsRequiredComponents() {
        // Test that health check includes all required components
        ResponseEntity<Map> response = restTemplate.getForEntity(
            getBaseUrl() + "/health", Map.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        Map<String, Object> health = response.getBody();
        assertThat(health).containsKey("modelRegistry");
        assertThat(health).containsKey("dataLake");
        assertThat(health).containsKey("spark");
        assertThat(health).containsKey("timestamp");

        // Check model registry status
        @SuppressWarnings("unchecked")
        Map<String, Object> modelRegistry = (Map<String, Object>) health.get("modelRegistry");
        assertThat(modelRegistry.get("status")).isEqualTo("UP");
        assertThat(modelRegistry).containsKey("cachedModels");

        // Check data lake status
        @SuppressWarnings("unchecked")
        Map<String, Object> dataLake = (Map<String, Object>) health.get("dataLake");
        assertThat(dataLake.get("status")).isEqualTo("UP");
        assertThat(dataLake).containsKey("totalSizeGB");

        // Check Spark status
        @SuppressWarnings("unchecked")
        Map<String, Object> spark = (Map<String, Object>) health.get("spark");
        assertThat(spark.get("status")).isEqualTo("UP");
        assertThat(spark).containsKey("applicationId");
    }
}