package com.fintech.batch.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Inference Result Model
 * 
 * Represents the output of an ML inference operation.
 * Contains predictions, confidence scores, and metadata.
 */
@Data
@Builder
public class InferenceResult {
    
    private String requestId;
    private String userId;
    private String sessionId;
    private String modelType;
    private String modelVersion;
    private LocalDateTime predictionTimestamp;
    
    // Prediction results
    private double creditScore;
    private String riskCategory;
    private double confidenceScore;
    private Map<String, Double> featureImportance;
    
    // Model metadata
    private String jobId;
    private long processingTimeMs;
    private Map<String, Object> additionalMetrics;
    
    /**
     * Get risk level as numeric value
     */
    public int getRiskLevel() {
        if (riskCategory == null) {
            return 0;
        }
        
        switch (riskCategory.toUpperCase()) {
            case "LOW":
                return 1;
            case "MEDIUM":
                return 2;
            case "HIGH":
                return 3;
            default:
                return 0;
        }
    }
    
    /**
     * Check if prediction meets confidence threshold
     */
    public boolean isHighConfidence(double threshold) {
        return confidenceScore >= threshold;
    }
    
    /**
     * Get formatted prediction summary
     */
    public String getPredictionSummary() {
        return String.format(
            "Credit Score: %.0f, Risk: %s, Confidence: %.2f",
            creditScore, riskCategory, confidenceScore
        );
    }
}