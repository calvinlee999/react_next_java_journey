package com.fintech.batch.controller;

import com.fintech.batch.service.StreamingInferenceService;
import com.fintech.batch.service.InMemoryModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Streaming Inference Controller
 * 
 * Provides REST endpoints for managing and monitoring the near real-time
 * streaming inference pipeline powered by Spark Structured Streaming
 * and Kafka micro-batch processing.
 * 
 * Endpoints:
 * - GET /streaming/status - Get streaming pipeline status
 * - POST /streaming/start - Start streaming pipeline
 * - POST /streaming/stop - Stop streaming pipeline
 * - POST /streaming/restart - Restart streaming pipeline
 * - GET /streaming/metrics - Get streaming performance metrics
 * - GET /streaming/health - Health check for streaming components
 */
@RestController
@RequestMapping("/api/v1/streaming")
public class StreamingInferenceController {

    private final StreamingInferenceService streamingInferenceService;
    private final InMemoryModelService inMemoryModelService;

    @Autowired
    public StreamingInferenceController(
            StreamingInferenceService streamingInferenceService,
            InMemoryModelService inMemoryModelService) {
        this.streamingInferenceService = streamingInferenceService;
        this.inMemoryModelService = inMemoryModelService;
    }

    /**
     * Get current streaming pipeline status
     * Returns detailed information about the Spark Structured Streaming query
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStreamingStatus() {
        try {
            StreamingInferenceService.StreamingQueryStatus status = 
                streamingInferenceService.getStreamingStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("isActive", status.isActive);
            response.put("message", status.message);
            response.put("lastProgress", status.lastProgress);
            response.put("hasRecentProgress", status.recentProgress != null && status.recentProgress.length > 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get streaming status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Start the streaming inference pipeline
     * Initializes Spark Structured Streaming with micro-batch processing
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startStreaming() {
        try {
            streamingInferenceService.startStreaming();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "started");
            response.put("message", "Streaming inference pipeline started successfully");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to start streaming: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Stop the streaming inference pipeline
     * Gracefully shuts down the Spark Structured Streaming query
     */
    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stopStreaming() {
        try {
            streamingInferenceService.stopStreaming();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "stopped");
            response.put("message", "Streaming inference pipeline stopped successfully");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to stop streaming: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Restart the streaming inference pipeline
     * Useful for applying configuration changes or recovering from errors
     */
    @PostMapping("/restart")
    public ResponseEntity<Map<String, Object>> restartStreaming() {
        try {
            streamingInferenceService.restartStreaming();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "restarted");
            response.put("message", "Streaming inference pipeline restarted successfully");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to restart streaming: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get streaming performance metrics
     * Returns detailed metrics about throughput, latency, and processing efficiency
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getStreamingMetrics() {
        try {
            StreamingInferenceService.StreamingMetrics metrics = 
                streamingInferenceService.getStreamingMetrics();
            
            InMemoryModelService.CacheStatistics cacheStats = 
                inMemoryModelService.getCacheStatistics();
            
            Map<String, Object> response = new HashMap<>();
            
            // Streaming metrics
            Map<String, Object> streamingMetrics = new HashMap<>();
            streamingMetrics.put("currentBatchId", metrics.batchId);
            streamingMetrics.put("inputRowsPerSecond", metrics.inputRowsPerSecond);
            streamingMetrics.put("processedRowsPerSecond", metrics.processedRowsPerSecond);
            streamingMetrics.put("batchDurationMs", metrics.batchDurationMs);
            streamingMetrics.put("triggerExecutionMs", metrics.triggerExecutionMs);
            
            // Model cache metrics
            Map<String, Object> modelCacheMetrics = new HashMap<>();
            modelCacheMetrics.put("currentSize", cacheStats.currentSize);
            modelCacheMetrics.put("maxSize", cacheStats.maxSize);
            modelCacheMetrics.put("utilizationPercent", 
                (double) cacheStats.currentSize / cacheStats.maxSize * 100);
            
            // Individual model metrics
            Map<String, Object> modelPerformance = new HashMap<>();
            cacheStats.modelMetrics.forEach((modelName, modelMetrics) -> {
                Map<String, Object> modelStats = new HashMap<>();
                modelStats.put("totalRequests", modelMetrics.getTotalRequests());
                modelStats.put("averageLatencyMs", modelMetrics.getAverageLatencyMs());
                modelStats.put("successRate", modelMetrics.getSuccessRate());
                modelPerformance.put(modelName, modelStats);
            });
            
            response.put("streaming", streamingMetrics);
            response.put("modelCache", modelCacheMetrics);
            response.put("modelPerformance", modelPerformance);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get streaming metrics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Health check for streaming inference components
     * Validates the health of streaming pipeline and model cache
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getStreamingHealth() {
        Map<String, Object> health = new HashMap<>();
        boolean overallHealthy = true;
        
        try {
            // Check streaming pipeline health
            boolean streamingHealthy = streamingInferenceService.isHealthy();
            health.put("streamingPipeline", Map.of(
                "status", streamingHealthy ? "healthy" : "unhealthy",
                "description", streamingHealthy ? 
                    "Streaming pipeline is active and processing data" :
                    "Streaming pipeline is not active or has errors"
            ));
            overallHealthy = overallHealthy && streamingHealthy;
            
            // Check model cache health
            InMemoryModelService.CacheStatistics cacheStats = 
                inMemoryModelService.getCacheStatistics();
            boolean cacheHealthy = cacheStats.currentSize >= 0; // Basic check
            health.put("modelCache", Map.of(
                "status", cacheHealthy ? "healthy" : "unhealthy",
                "description", String.format("Model cache has %d/%d models loaded", 
                    cacheStats.currentSize, cacheStats.maxSize)
            ));
            overallHealthy = overallHealthy && cacheHealthy;
            
            // Overall health
            health.put("overall", Map.of(
                "status", overallHealthy ? "healthy" : "unhealthy",
                "timestamp", System.currentTimeMillis()
            ));
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            health.put("overall", Map.of(
                "status", "unhealthy",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
            return ResponseEntity.status(503).body(health);
        }
    }

    /**
     * Get streaming configuration information
     * Returns current configuration settings for the streaming pipeline
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getStreamingConfig() {
        Map<String, Object> config = new HashMap<>();
        
        config.put("triggerInterval", "500 milliseconds");
        config.put("processingMode", "micro-batch");
        config.put("inputTopic", "realtime-inference-input");
        config.put("outputTopic", "realtime-inference-output");
        config.put("checkpointLocation", "/tmp/streaming-checkpoints");
        config.put("watermarkDelay", "1 minute");
        
        Map<String, Object> optimizations = new HashMap<>();
        optimizations.put("adaptiveQueryExecution", true);
        optimizations.put("dynamicAllocation", true);
        optimizations.put("streamingMetrics", true);
        optimizations.put("exactlyOnceSemantics", true);
        
        config.put("optimizations", optimizations);
        config.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(config);
    }

    /**
     * Get streaming pipeline statistics
     * Provides operational insights and troubleshooting information
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStreamingStatistics() {
        try {
            StreamingInferenceService.StreamingQueryStatus status = 
                streamingInferenceService.getStreamingStatus();
            
            Map<String, Object> statistics = new HashMap<>();
            
            // Basic statistics
            statistics.put("isRunning", status.isActive);
            statistics.put("uptime", calculateUptime());
            statistics.put("lastUpdateTime", System.currentTimeMillis());
            
            // Performance indicators
            Map<String, Object> performance = new HashMap<>();
            performance.put("averageProcessingTime", "< 500ms");
            performance.put("throughputTarget", "10,000 records/second");
            performance.put("latencyTarget", "< 1 second end-to-end");
            performance.put("availabilityTarget", "99.9%");
            
            statistics.put("performanceTargets", performance);
            
            // Resource utilization (simulated)
            Map<String, Object> resources = new HashMap<>();
            resources.put("sparkExecutors", "2-10 (auto-scaling)");
            resources.put("kafkaPartitions", "6");
            resources.put("memoryUtilization", "65%");
            resources.put("cpuUtilization", "45%");
            
            statistics.put("resourceUtilization", resources);
            
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get streaming statistics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Calculate uptime (simplified implementation)
     */
    private String calculateUptime() {
        // This would typically track actual start time
        return "< 1 hour"; // Placeholder
    }
}