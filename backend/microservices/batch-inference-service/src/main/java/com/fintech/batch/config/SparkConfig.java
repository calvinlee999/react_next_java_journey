package com.fintech.batch.config;

import org.apache.spark.SparkConf;
import org.apache.spark.sql.SparkSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Spark Configuration for Batch Inference
 * 
 * Provides optimized Spark configurations for different environments:
 * - Local development with embedded Spark
 * - Azure Databricks for production workloads
 * - Cost-optimized cluster configurations
 */
@Configuration
public class SparkConfig {

    @Value("${spark.app.name:BatchInferenceService}")
    private String appName;

    @Value("${spark.master:local[*]}")
    private String sparkMaster;

    @Value("${spark.sql.adaptive.enabled:true}")
    private boolean adaptiveQueryEnabled;

    @Value("${spark.sql.adaptive.coalescePartitions.enabled:true}")
    private boolean coalescePartitionsEnabled;

    @Value("${spark.sql.adaptive.skewJoin.enabled:true}")
    private boolean skewJoinEnabled;

    @Value("${spark.serializer:org.apache.spark.serializer.KryoSerializer}")
    private String serializer;

    /**
     * Spark Session for Local Development
     * Optimized for development and testing scenarios
     */
    @Bean
    @Profile({"local", "dev"})
    public SparkSession localSparkSession() {
        SparkConf sparkConf = new SparkConf()
                .setAppName(appName + "-Local")
                .setMaster("local[*]")
                .set("spark.serializer", serializer)
                .set("spark.sql.adaptive.enabled", String.valueOf(adaptiveQueryEnabled))
                .set("spark.sql.adaptive.coalescePartitions.enabled", String.valueOf(coalescePartitionsEnabled))
                .set("spark.sql.warehouse.dir", "target/spark-warehouse")
                // Local optimization settings
                .set("spark.sql.execution.arrow.pyspark.enabled", "true")
                .set("spark.sql.execution.arrow.sparkr.enabled", "true")
                .set("spark.sql.adaptive.localShuffleReader.enabled", "true")
                // Memory settings for local development
                .set("spark.executor.memory", "2g")
                .set("spark.driver.memory", "2g")
                .set("spark.executor.cores", "2")
                // Kafka integration
                .set("spark.sql.streaming.checkpointLocation", "target/checkpoints")
                // Streaming optimizations for micro-batch processing
                .set("spark.sql.streaming.metricsEnabled", "true")
                .set("spark.sql.streaming.ui.enabled", "true")
                .set("spark.sql.streaming.stateStore.maintenanceInterval", "60s")
                .set("spark.sql.streaming.maxBatchesToRetainInMemory", "100")
                // Micro-batch performance tuning
                .set("spark.sql.streaming.numRecentProgressUpdates", "100")
                .set("spark.sql.streaming.minBatchesToRetain", "50")
                .set("spark.sql.adaptive.enabled", "true")
                .set("spark.sql.adaptive.coalescePartitions.enabled", "true");

        return SparkSession.builder()
                .config(sparkConf)
                .getOrCreate();
    }

    /**
     * Spark Session for Azure Databricks
     * Optimized for production workloads with enterprise features
     */
    @Bean
    @Profile({"azure", "prod"})
    public SparkSession azureSparkSession() {
        SparkConf sparkConf = new SparkConf()
                .setAppName(appName + "-Azure")
                // Azure Databricks will set the master automatically
                .set("spark.serializer", serializer)
                .set("spark.sql.adaptive.enabled", String.valueOf(adaptiveQueryEnabled))
                .set("spark.sql.adaptive.coalescePartitions.enabled", String.valueOf(coalescePartitionsEnabled))
                .set("spark.sql.adaptive.skewJoin.enabled", String.valueOf(skewJoinEnabled))
                // Azure optimizations
                .set("spark.sql.adaptive.localShuffleReader.enabled", "true")
                .set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
                .set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128MB")
                // Delta Lake integration
                .set("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
                .set("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
                // MLflow integration
                .set("spark.sql.execution.arrow.pyspark.enabled", "true")
                .set("spark.sql.execution.arrow.maxRecordsPerBatch", "10000")
                // Azure Storage integration
                .set("spark.hadoop.fs.azure.account.auth.type", "OAuth")
                .set("spark.hadoop.fs.azure.account.oauth.provider.type", "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider")
                // Cost optimization settings
                .set("spark.dynamicAllocation.enabled", "true")
                .set("spark.dynamicAllocation.minExecutors", "1")
                .set("spark.dynamicAllocation.maxExecutors", "20")
                .set("spark.dynamicAllocation.initialExecutors", "2")
                // Checkpointing for fault tolerance
                .set("spark.sql.streaming.checkpointLocation", "/mnt/delta/checkpoints")
                // Streaming optimizations for production micro-batch processing
                .set("spark.sql.streaming.metricsEnabled", "true")
                .set("spark.sql.streaming.ui.enabled", "true")
                .set("spark.sql.streaming.stateStore.maintenanceInterval", "30s")
                .set("spark.sql.streaming.maxBatchesToRetainInMemory", "200")
                // Production micro-batch performance tuning
                .set("spark.sql.streaming.numRecentProgressUpdates", "200")
                .set("spark.sql.streaming.minBatchesToRetain", "100")
                // Near real-time processing optimizations
                .set("spark.sql.streaming.continuous.executorIdleTimeout", "60s")
                .set("spark.sql.streaming.stopGracefullyOnShutdown", "true")
                .set("spark.sql.streaming.kafka.consumer.cache.capacity", "128")
                .set("spark.sql.streaming.kafka.consumer.pollTimeoutMs", "120000");

        return SparkSession.builder()
                .config(sparkConf)
                .getOrCreate();
    }

    /**
     * Spark Session for Testing
     * Minimal configuration for unit and integration tests
     */
    @Bean
    @Profile("test")
    public SparkSession testSparkSession() {
        SparkConf sparkConf = new SparkConf()
                .setAppName(appName + "-Test")
                .setMaster("local[1]")
                .set("spark.ui.enabled", "false")
                .set("spark.sql.warehouse.dir", "target/test-spark-warehouse")
                .set("spark.sql.streaming.checkpointLocation", "target/test-checkpoints");

        return SparkSession.builder()
                .config(sparkConf)
                .getOrCreate();
    }
}