package com.fintech.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enterprise Batch Inference Service
 * 
 * This service provides large-scale batch ML inference capabilities using:
 * - Apache Spark for distributed processing
 * - Kafka/Confluent for event streaming and data ingestion
 * - Azure Databricks for managed Spark clusters
 * - MLflow for model registry and versioning
 * 
 * Key Features:
 * - Workload separation between real-time and batch inference
 * - Cost-optimized batch processing with scheduled jobs
 * - Unified data platform with Kafka as source of truth
 * - Enterprise-grade observability and monitoring
 * 
 * @author Enterprise AI Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
@EnableAsync
public class BatchInferenceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BatchInferenceApplication.class, args);
    }
}