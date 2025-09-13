package com.fintech.batch.service;

import com.fintech.batch.model.InferenceRequest;
import com.fintech.batch.model.InferenceResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-Memory Model Serving Service
 * 
 * Provides ultra-low latency model inference by keeping pre-loaded models
 * in memory with intelligent caching and warm-up strategies. Designed to
 * complement Spark Structured Streaming for near real-time processing.
 * 
 * Key Features:
 * - In-memory model caching with automatic warm-up
 * - Hot/Cold model management based on usage patterns
 * - Thread-safe concurrent model serving
 * - Feature transformation pipelines
 * - Model performance monitoring and metrics
 * - Automatic model version management
 */
@Service
public class InMemoryModelService {

    private static final Logger logger = LoggerFactory.getLogger(InMemoryModelService.class);

    // Model cache with concurrent access support
    private final Map<String, CachedModel> modelCache = new ConcurrentHashMap<>();
    private final Map<String, ModelMetrics> modelMetrics = new ConcurrentHashMap<>();
    
    // Configuration
    @Value("${model.cache.max-size:10}")
    private int maxCacheSize;
    
    @Value("${model.cache.ttl-minutes:60}")
    private int cacheTtlMinutes;
    
    @Value("${model.warmup.enabled:true}")
    private boolean warmupEnabled;
    
    @Value("${model.preload.models:credit-risk-model,fraud-detection-model}")
    private String[] preloadModels;

    /**
     * Initialize the in-memory model service
     */
    @PostConstruct
    public void initialize() {
        logger.info("Initializing In-Memory Model Service with cache size: {}", maxCacheSize);
        
        if (warmupEnabled) {
            warmupModels();
        }
        
        // Start background cache maintenance
        startCacheMaintenance();
    }

    /**
     * Perform synchronous inference on a single request
     * Optimized for ultra-low latency (< 10ms)
     */
    public InferenceResult predict(InferenceRequest request) {
        long startTime = System.nanoTime();
        
        try {
            // Get or load model from cache
            CachedModel model = getModel(request.getModelName(), request.getModelVersion());
            
            // Transform features to model format
            double[] features = transformFeatures(request.getFeatures(), model.getFeatureSchema());
            
            // Execute inference
            double prediction = model.predict(features);
            
            // Calculate confidence/probability
            double confidence = model.getConfidence(features, prediction);
            
            // Update metrics
            updateMetrics(request.getModelName(), System.nanoTime() - startTime, true);
            
            return InferenceResult.builder()
                    .requestId(request.getRequestId())
                    .prediction(prediction)
                    .confidence(confidence)
                    .modelName(request.getModelName())
                    .modelVersion(model.getVersion())
                    .processingTimeMs((System.nanoTime() - startTime) / 1_000_000.0)
                    .timestamp(new Date())
                    .build();
                    
        } catch (Exception e) {
            logger.error("Error during inference for request: {}", request.getRequestId(), e);
            updateMetrics(request.getModelName(), System.nanoTime() - startTime, false);
            
            return InferenceResult.builder()
                    .requestId(request.getRequestId())
                    .error("Inference failed: " + e.getMessage())
                    .modelName(request.getModelName())
                    .processingTimeMs((System.nanoTime() - startTime) / 1_000_000.0)
                    .timestamp(new Date())
                    .build();
        }
    }

    /**
     * Perform batch inference on multiple requests
     * Optimized for throughput while maintaining low latency
     */
    public List<InferenceResult> predictBatch(List<InferenceRequest> requests) {
        long startTime = System.nanoTime();
        
        try {
            // Group requests by model for efficient processing
            Map<String, List<InferenceRequest>> requestsByModel = new HashMap<>();
            for (InferenceRequest request : requests) {
                String modelKey = request.getModelName() + ":" + request.getModelVersion();
                requestsByModel.computeIfAbsent(modelKey, k -> new ArrayList<>()).add(request);
            }
            
            List<InferenceResult> results = new ArrayList<>();
            
            // Process each model group
            for (Map.Entry<String, List<InferenceRequest>> entry : requestsByModel.entrySet()) {
                String modelKey = entry.getKey();
                List<InferenceRequest> modelRequests = entry.getValue();
                
                String[] parts = modelKey.split(":");
                String modelName = parts[0];
                String modelVersion = parts.length > 1 ? parts[1] : "latest";
                
                // Get model once for all requests
                CachedModel model = getModel(modelName, modelVersion);
                
                // Process batch for this model
                for (InferenceRequest request : modelRequests) {
                    try {
                        double[] features = transformFeatures(request.getFeatures(), model.getFeatureSchema());
                        double prediction = model.predict(features);
                        double confidence = model.getConfidence(features, prediction);
                        
                        results.add(InferenceResult.builder()
                                .requestId(request.getRequestId())
                                .prediction(prediction)
                                .confidence(confidence)
                                .modelName(modelName)
                                .modelVersion(model.getVersion())
                                .processingTimeMs((System.nanoTime() - startTime) / 1_000_000.0)
                                .timestamp(new Date())
                                .build());
                                
                    } catch (Exception e) {
                        logger.error("Error processing batch request: {}", request.getRequestId(), e);
                        results.add(InferenceResult.builder()
                                .requestId(request.getRequestId())
                                .error("Batch inference failed: " + e.getMessage())
                                .modelName(modelName)
                                .processingTimeMs((System.nanoTime() - startTime) / 1_000_000.0)
                                .timestamp(new Date())
                                .build());
                    }
                }
                
                updateMetrics(modelName, System.nanoTime() - startTime, true);
            }
            
            return results;
            
        } catch (Exception e) {
            logger.error("Error during batch inference", e);
            throw new RuntimeException("Batch inference failed", e);
        }
    }

    /**
     * Get model from cache or load if not present
     */
    private CachedModel getModel(String modelName, String modelVersion) {
        String cacheKey = modelName + ":" + (modelVersion != null ? modelVersion : "latest");
        
        CachedModel cachedModel = modelCache.get(cacheKey);
        if (cachedModel != null && !cachedModel.isExpired()) {
            cachedModel.updateLastAccessed();
            return cachedModel;
        }
        
        // Load model (simulate model loading - replace with actual implementation)
        logger.info("Loading model: {} version: {}", modelName, modelVersion);
        CachedModel newModel = loadModel(modelName, modelVersion);
        
        // Manage cache size
        if (modelCache.size() >= maxCacheSize) {
            evictLeastRecentlyUsed();
        }
        
        modelCache.put(cacheKey, newModel);
        return newModel;
    }

    /**
     * Load model from storage (simulated implementation)
     */
    private CachedModel loadModel(String modelName, String modelVersion) {
        // Simulate model loading time
        try {
            Thread.sleep(100); // 100ms loading time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Create mock model based on name
        return new CachedModel(modelName, modelVersion, createMockModel(modelName));
    }

    /**
     * Create mock model for demonstration (replace with actual model loading)
     */
    private MockModel createMockModel(String modelName) {
        switch (modelName) {
            case "credit-risk-model":
                return new CreditRiskModel();
            case "fraud-detection-model":
                return new FraudDetectionModel();
            case "customer-segmentation-model":
                return new CustomerSegmentationModel();
            default:
                return new DefaultModel();
        }
    }

    /**
     * Transform features to model-expected format
     */
    private double[] transformFeatures(Map<String, Double> features, String[] featureSchema) {
        double[] transformed = new double[featureSchema.length];
        
        for (int i = 0; i < featureSchema.length; i++) {
            String featureName = featureSchema[i];
            transformed[i] = features.getOrDefault(featureName, 0.0);
        }
        
        return transformed;
    }

    /**
     * Update model performance metrics
     */
    private void updateMetrics(String modelName, long processingTimeNs, boolean success) {
        ModelMetrics metrics = modelMetrics.computeIfAbsent(modelName, k -> new ModelMetrics());
        metrics.updateMetrics(processingTimeNs, success);
    }

    /**
     * Evict least recently used model from cache
     */
    private void evictLeastRecentlyUsed() {
        String lruKey = null;
        long oldestAccess = Long.MAX_VALUE;
        
        for (Map.Entry<String, CachedModel> entry : modelCache.entrySet()) {
            if (entry.getValue().getLastAccessTime() < oldestAccess) {
                oldestAccess = entry.getValue().getLastAccessTime();
                lruKey = entry.getKey();
            }
        }
        
        if (lruKey != null) {
            modelCache.remove(lruKey);
            logger.info("Evicted model from cache: {}", lruKey);
        }
    }

    /**
     * Warm up frequently used models
     */
    private void warmupModels() {
        logger.info("Warming up models: {}", Arrays.toString(preloadModels));
        
        for (String modelName : preloadModels) {
            try {
                getModel(modelName, "latest");
                logger.info("Warmed up model: {}", modelName);
            } catch (Exception e) {
                logger.error("Failed to warm up model: {}", modelName, e);
            }
        }
    }

    /**
     * Start background cache maintenance
     */
    private void startCacheMaintenance() {
        Timer timer = new Timer("ModelCacheMaintenance", true);
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                cleanupExpiredModels();
                logCacheStatistics();
            }
        }, 60000, 60000); // Run every minute
    }

    /**
     * Clean up expired models from cache
     */
    private void cleanupExpiredModels() {
        Iterator<Map.Entry<String, CachedModel>> iterator = modelCache.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, CachedModel> entry = iterator.next();
            if (entry.getValue().isExpired()) {
                iterator.remove();
                logger.info("Removed expired model from cache: {}", entry.getKey());
            }
        }
    }

    /**
     * Log cache statistics for monitoring
     */
    private void logCacheStatistics() {
        logger.info("Model cache statistics - Size: {}/{}, Models: {}", 
                    modelCache.size(), maxCacheSize, modelCache.keySet());
        
        for (Map.Entry<String, ModelMetrics> entry : modelMetrics.entrySet()) {
            ModelMetrics metrics = entry.getValue();
            logger.info("Model {} metrics - Requests: {}, Avg latency: {:.2f}ms, Success rate: {:.2f}%",
                        entry.getKey(), 
                        metrics.getTotalRequests(),
                        metrics.getAverageLatencyMs(),
                        metrics.getSuccessRate() * 100);
        }
    }

    /**
     * Get current cache statistics
     */
    public CacheStatistics getCacheStatistics() {
        return new CacheStatistics(
                modelCache.size(),
                maxCacheSize,
                new HashMap<>(modelMetrics)
        );
    }

    // Inner classes for model caching and metrics

    /**
     * Cached model wrapper with expiration and access tracking
     */
    private class CachedModel {
        private final String name;
        private final String version;
        private final MockModel model;
        private final long loadTime;
        private volatile long lastAccessTime;

        public CachedModel(String name, String version, MockModel model) {
            this.name = name;
            this.version = version;
            this.model = model;
            this.loadTime = System.currentTimeMillis();
            this.lastAccessTime = System.currentTimeMillis();
        }

        public double predict(double[] features) {
            return model.predict(features);
        }

        public double getConfidence(double[] features, double prediction) {
            return model.getConfidence(features, prediction);
        }

        public String[] getFeatureSchema() {
            return model.getFeatureSchema();
        }

        public String getVersion() {
            return version;
        }

        public long getLastAccessTime() {
            return lastAccessTime;
        }

        public void updateLastAccessed() {
            this.lastAccessTime = System.currentTimeMillis();
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - loadTime > cacheTtlMinutes * 60 * 1000L;
        }
    }

    /**
     * Model performance metrics
     */
    private static class ModelMetrics {
        private final AtomicLong totalRequests = new AtomicLong();
        private final AtomicLong successfulRequests = new AtomicLong();
        private final AtomicLong totalLatencyNs = new AtomicLong();

        public void updateMetrics(long latencyNs, boolean success) {
            totalRequests.incrementAndGet();
            totalLatencyNs.addAndGet(latencyNs);
            if (success) {
                successfulRequests.incrementAndGet();
            }
        }

        public long getTotalRequests() {
            return totalRequests.get();
        }

        public double getAverageLatencyMs() {
            long total = totalRequests.get();
            return total > 0 ? totalLatencyNs.get() / (double) total / 1_000_000.0 : 0.0;
        }

        public double getSuccessRate() {
            long total = totalRequests.get();
            return total > 0 ? successfulRequests.get() / (double) total : 0.0;
        }
    }

    /**
     * Cache statistics for monitoring
     */
    public static class CacheStatistics {
        public final int currentSize;
        public final int maxSize;
        public final Map<String, ModelMetrics> modelMetrics;

        public CacheStatistics(int currentSize, int maxSize, Map<String, ModelMetrics> modelMetrics) {
            this.currentSize = currentSize;
            this.maxSize = maxSize;
            this.modelMetrics = modelMetrics;
        }
    }

    // Mock model implementations (replace with actual ML models)

    private interface MockModel {
        double predict(double[] features);
        double getConfidence(double[] features, double prediction);
        String[] getFeatureSchema();
    }

    private static class CreditRiskModel implements MockModel {
        private static final String[] SCHEMA = {"credit_score", "income", "debt_ratio", "employment_years", "age"};

        @Override
        public double predict(double[] features) {
            // Simple linear combination for demo
            return Math.max(0, Math.min(1, 
                    0.8 - (features[0] / 850.0) * 0.5 + 
                    (features[2] / 100.0) * 0.3));
        }

        @Override
        public double getConfidence(double[] features, double prediction) {
            return 0.85 + Math.random() * 0.1; // Mock confidence
        }

        @Override
        public String[] getFeatureSchema() {
            return SCHEMA;
        }
    }

    private static class FraudDetectionModel implements MockModel {
        private static final String[] SCHEMA = {"transaction_amount", "merchant_category", "time_since_last", "location_risk"};

        @Override
        public double predict(double[] features) {
            // Mock fraud probability
            return Math.max(0, Math.min(1, features[0] / 10000.0 + features[3] * 0.4));
        }

        @Override
        public double getConfidence(double[] features, double prediction) {
            return 0.9 + Math.random() * 0.05;
        }

        @Override
        public String[] getFeatureSchema() {
            return SCHEMA;
        }
    }

    private static class CustomerSegmentationModel implements MockModel {
        private static final String[] SCHEMA = {"spending_score", "frequency", "recency", "avg_order_value"};

        @Override
        public double predict(double[] features) {
            // Mock segment (0-4 for 5 segments)
            return Math.floor(Math.random() * 5);
        }

        @Override
        public double getConfidence(double[] features, double prediction) {
            return 0.75 + Math.random() * 0.15;
        }

        @Override
        public String[] getFeatureSchema() {
            return SCHEMA;
        }
    }

    private static class DefaultModel implements MockModel {
        private static final String[] SCHEMA = {"feature1", "feature2", "feature3"};

        @Override
        public double predict(double[] features) {
            return Math.random();
        }

        @Override
        public double getConfidence(double[] features, double prediction) {
            return 0.5 + Math.random() * 0.3;
        }

        @Override
        public String[] getFeatureSchema() {
            return SCHEMA;
        }
    }
}