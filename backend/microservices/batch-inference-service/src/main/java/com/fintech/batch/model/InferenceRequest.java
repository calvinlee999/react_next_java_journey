package com.fintech.batch.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Inference Request Model
 * 
 * Represents a single inference request within a batch job.
 * Contains input data and metadata for ML model processing.
 */
@Data
@Builder
public class InferenceRequest {
    
    private String requestId;
    private String userId;
    private String sessionId;
    private Map<String, Object> features;
    private String modelType;
    private String modelVersion;
    private LocalDateTime timestamp;
    private Map<String, String> metadata;
    
    /**
     * Get feature value by name with type casting
     */
    @SuppressWarnings("unchecked")
    public <T> T getFeature(String name, Class<T> type) {
        Object value = features.get(name);
        if (value == null) {
            return null;
        }
        
        if (type.isInstance(value)) {
            return (T) value;
        }
        
        // Handle common type conversions
        if (type == String.class) {
            return (T) value.toString();
        }
        
        if (type == Double.class && value instanceof Number) {
            return (T) Double.valueOf(((Number) value).doubleValue());
        }
        
        if (type == Integer.class && value instanceof Number) {
            return (T) Integer.valueOf(((Number) value).intValue());
        }
        
        throw new ClassCastException(
            String.format("Cannot cast feature '%s' of type %s to %s", 
                         name, value.getClass().getSimpleName(), type.getSimpleName())
        );
    }
    
    /**
     * Check if request has required features
     */
    public boolean hasRequiredFeatures(String... requiredFeatures) {
        if (features == null) {
            return false;
        }
        
        for (String feature : requiredFeatures) {
            if (!features.containsKey(feature) || features.get(feature) == null) {
                return false;
            }
        }
        
        return true;
    }
}