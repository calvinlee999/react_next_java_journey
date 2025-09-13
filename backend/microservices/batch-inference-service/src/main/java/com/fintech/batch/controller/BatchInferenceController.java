package com.fintech.batch.controller;

import com.fintech.batch.model.BatchJob;
import com.fintech.batch.service.BatchInferenceService;
import com.fintech.batch.service.DataLakeService;
import com.fintech.batch.service.ModelRegistryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Batch Inference REST Controller
 * 
 * Provides REST endpoints for managing batch inference jobs and monitoring.
 * Supports job submission, status monitoring, and system health checks.
 */
@RestController
@RequestMapping("/api/v1/batch-inference")
@CrossOrigin(origins = "*")
public class BatchInferenceController {

    private static final Logger logger = LoggerFactory.getLogger(BatchInferenceController.class);

    private final BatchInferenceService batchInferenceService;
    private final ModelRegistryService modelRegistryService;
    private final DataLakeService dataLakeService;

    @Autowired
    public BatchInferenceController(
            BatchInferenceService batchInferenceService,
            ModelRegistryService modelRegistryService,
            DataLakeService dataLakeService) {
        this.batchInferenceService = batchInferenceService;
        this.modelRegistryService = modelRegistryService;
        this.dataLakeService = dataLakeService;
    }

    /**
     * Submit a new batch inference job
     */
    @PostMapping("/jobs")
    public ResponseEntity<Map<String, Object>> submitBatchJob(@RequestBody Map<String, Object> jobRequest) {
        logger.info("Received batch job submission request");
        
        try {
            String jobId = "job-" + System.currentTimeMillis();
            
            // Submit job asynchronously
            CompletableFuture<BatchJob> jobFuture = batchInferenceService.runBatchInferenceAsync(jobId);
            
            Map<String, Object> response = Map.of(
                "jobId", jobId,
                "status", "SUBMITTED",
                "message", "Batch inference job submitted successfully"
            );
            
            logger.info("Batch job submitted successfully: {}", jobId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to submit batch job", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Job submission failed",
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get system health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        logger.debug("Health check requested");
        
        try {
            // Check model registry status
            Map<String, Object> modelStats = modelRegistryService.getCacheStats();
            
            // Check data lake status
            DataLakeService.DataLakeMetrics dataLakeMetrics = dataLakeService.getStorageMetrics();
            
            Map<String, Object> healthStatus = Map.of(
                "status", "UP",
                "timestamp", System.currentTimeMillis(),
                "modelRegistry", Map.of(
                    "status", "UP",
                    "cachedModels", modelStats.get("cached_models")
                ),
                "dataLake", Map.of(
                    "status", "UP",
                    "totalSizeGB", dataLakeMetrics.getTotalSizeBytes() / (1024 * 1024 * 1024)
                ),
                "spark", Map.of(
                    "status", "UP",
                    "applicationId", "spark-batch-inference"
                )
            );
            
            return ResponseEntity.ok(healthStatus);
            
        } catch (Exception e) {
            logger.error("Health check failed", e);
            
            Map<String, Object> healthStatus = Map.of(
                "status", "DOWN",
                "timestamp", System.currentTimeMillis(),
                "error", e.getMessage()
            );
            
            return ResponseEntity.ok(healthStatus);
        }
    }

    /**
     * Get model information
     */
    @GetMapping("/models/{modelName}")
    public ResponseEntity<Map<String, Object>> getModelInfo(@PathVariable String modelName) {
        logger.info("Model info requested for: {}", modelName);
        
        try {
            ModelRegistryService.ModelMetadata metadata = modelRegistryService.getModelMetadata(modelName);
            
            if (metadata == null) {
                Map<String, Object> errorResponse = Map.of(
                    "error", "Model not found",
                    "modelName", modelName
                );
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> modelInfo = Map.of(
                "modelName", metadata.getModelName(),
                "version", metadata.getVersion(),
                "stage", metadata.getStage(),
                "uri", metadata.getUri(),
                "metadata", metadata.getMetadata(),
                "lastUpdated", metadata.getLastUpdated()
            );
            
            return ResponseEntity.ok(modelInfo);
            
        } catch (Exception e) {
            logger.error("Failed to get model info for: {}", modelName, e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Failed to retrieve model information",
                "modelName", modelName,
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get available models
     */
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getAvailableModels() {
        logger.info("Available models requested");
        
        try {
            Map<String, Object> cacheStats = modelRegistryService.getCacheStats();
            
            Map<String, Object> response = Map.of(
                "models", cacheStats.get("model_names"),
                "totalModels", cacheStats.get("cached_models"),
                "cacheEnabled", cacheStats.get("cache_enabled")
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get available models", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Failed to retrieve available models",
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get data lake metrics
     */
    @GetMapping("/metrics/storage")
    public ResponseEntity<Map<String, Object>> getStorageMetrics() {
        logger.info("Storage metrics requested");
        
        try {
            DataLakeService.DataLakeMetrics metrics = dataLakeService.getStorageMetrics();
            
            Map<String, Object> response = Map.of(
                "historicalDataGB", metrics.getHistoricalDataSizeBytes() / (1024 * 1024 * 1024),
                "featuresDataGB", metrics.getFeaturesDataSizeBytes() / (1024 * 1024 * 1024),
                "predictionsDataGB", metrics.getPredictionsDataSizeBytes() / (1024 * 1024 * 1024),
                "totalDataGB", metrics.getTotalSizeBytes() / (1024 * 1024 * 1024),
                "lastUpdated", metrics.getLastUpdated()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get storage metrics", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Failed to retrieve storage metrics",
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Clear model cache
     */
    @PostMapping("/models/cache/clear")
    public ResponseEntity<Map<String, Object>> clearModelCache() {
        logger.info("Model cache clear requested");
        
        try {
            modelRegistryService.clearCache();
            
            Map<String, Object> response = Map.of(
                "message", "Model cache cleared successfully",
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to clear model cache", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Failed to clear model cache",
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Archive old data
     */
    @PostMapping("/data/archive")
    public ResponseEntity<Map<String, Object>> archiveOldData(
            @RequestParam(defaultValue = "30") int retentionDays) {
        logger.info("Data archival requested with {} days retention", retentionDays);
        
        try {
            dataLakeService.archiveOldData(retentionDays);
            
            Map<String, Object> response = Map.of(
                "message", "Data archival completed successfully",
                "retentionDays", retentionDays,
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to archive old data", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "Data archival failed",
                "retentionDays", retentionDays,
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}