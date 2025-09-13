package com.fintech.batch.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Batch Job Model
 * 
 * Represents a batch inference job with metadata and execution details.
 * Used for tracking job lifecycle, metrics, and debugging.
 */
@Data
@Builder
public class BatchJob {
    
    public enum Status {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    private String jobId;
    private Status status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long recordsProcessed;
    private String errorMessage;
    private String modelVersion;
    private String dataSource;
    
    /**
     * Calculate job duration in seconds
     */
    public long getDurationSeconds() {
        if (startTime == null) {
            return 0;
        }
        
        LocalDateTime end = endTime != null ? endTime : LocalDateTime.now();
        return ChronoUnit.SECONDS.between(startTime, end);
    }
    
    /**
     * Check if job is completed (successfully or with failure)
     */
    public boolean isCompleted() {
        return status == Status.COMPLETED || status == Status.FAILED || status == Status.CANCELLED;
    }
    
    /**
     * Check if job is currently running
     */
    public boolean isRunning() {
        return status == Status.RUNNING;
    }
}