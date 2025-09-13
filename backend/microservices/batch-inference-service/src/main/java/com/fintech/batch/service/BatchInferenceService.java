package com.fintech.batch.service;

import com.fintech.batch.config.KafkaConfig;
import com.fintech.batch.model.BatchJob;
import com.fintech.batch.model.InferenceRequest;
import com.fintech.batch.model.InferenceResult;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.streaming.StreamingQuery;
import org.apache.spark.sql.streaming.Trigger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Enterprise Batch Inference Service
 * 
 * Provides large-scale ML inference capabilities using Apache Spark and Kafka:
 * - Processes millions of records in batch mode
 * - Leverages Kafka for data ingestion and result publishing
 * - Optimized for cost-effective processing with scheduled jobs
 * - Supports model versioning and A/B testing
 * 
 * Key Design Principles:
 * - Workload separation from real-time inference
 * - Event sourcing with Kafka as source of truth
 * - Horizontal scaling with Spark clusters
 * - Enterprise observability and monitoring
 */
@Service
public class BatchInferenceService {

    private static final Logger logger = LoggerFactory.getLogger(BatchInferenceService.class);

    @Autowired
    private SparkSession sparkSession;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ModelRegistryService modelRegistryService;

    @Autowired
    private DataLakeService dataLakeService;

    @Value("${batch.inference.schedule.enabled:true}")
    private boolean scheduleEnabled;

    @Value("${batch.inference.batch.size:100000}")
    private int batchSize;

    @Value("${batch.inference.processing.timeout:3600}")
    private int processingTimeoutSeconds;

    @Value("${kafka.bootstrap.servers}")
    private String kafkaBootstrapServers;

    private StreamingQuery streamingQuery;

    /**
     * Initialize streaming batch processing
     * Sets up Kafka to Spark streaming pipeline
     */
    @PostConstruct
    public void initializeStreaming() {
        try {
            logger.info("Initializing Batch Inference Streaming Pipeline");
            
            // Set up structured streaming from Kafka
            Dataset<Row> kafkaStream = sparkSession
                .readStream()
                .format("kafka")
                .option("kafka.bootstrap.servers", kafkaBootstrapServers)
                .option("subscribe", KafkaConfig.Topics.BATCH_INFERENCE_INPUT)
                .option("startingOffsets", "latest")
                .option("maxOffsetsPerTrigger", batchSize)
                .option("failOnDataLoss", "false")
                .load();

            // Process streaming data
            this.streamingQuery = kafkaStream
                .writeStream()
                .foreachBatch((batchDF, batchId) -> {
                    logger.info("Processing batch {} with {} records", batchId, batchDF.count());
                    processBatchData(batchDF, batchId);
                })
                .trigger(Trigger.ProcessingTime(5, TimeUnit.MINUTES))
                .option("checkpointLocation", "/tmp/batch-inference-checkpoint")
                .start();

            logger.info("Batch Inference Streaming Pipeline initialized successfully");
            
        } catch (Exception e) {
            logger.error("Failed to initialize streaming pipeline", e);
            throw new RuntimeException("Streaming initialization failed", e);
        }
    }

    /**
     * Scheduled batch inference job
     * Runs every hour to process accumulated data
     */
    @Scheduled(cron = "0 0 * * * ?") // Every hour
    public void runScheduledBatchInference() {
        if (!scheduleEnabled) {
            logger.debug("Scheduled batch inference is disabled");
            return;
        }

        logger.info("Starting scheduled batch inference job at {}", LocalDateTime.now());
        
        try {
            // Process historical data from data lake
            CompletableFuture<BatchJob> batchJob = runBatchInferenceAsync("scheduled-" + System.currentTimeMillis());
            
            batchJob.thenAccept(job -> {
                logger.info("Scheduled batch job completed: {}", job.getJobId());
                publishJobMetrics(job);
            }).exceptionally(throwable -> {
                logger.error("Scheduled batch job failed", throwable);
                return null;
            });
            
        } catch (Exception e) {
            logger.error("Failed to start scheduled batch inference", e);
        }
    }

    /**
     * Asynchronous batch inference processing
     * Handles large-scale ML inference with Spark
     */
    @Async
    public CompletableFuture<BatchJob> runBatchInferenceAsync(String jobId) {
        logger.info("Starting async batch inference job: {}", jobId);
        
        BatchJob job = BatchJob.builder()
            .jobId(jobId)
            .startTime(LocalDateTime.now())
            .status(BatchJob.Status.RUNNING)
            .build();

        try {
            // Load data from multiple sources
            Dataset<Row> inputData = loadInputData(job);
            
            // Load and apply ML model
            Dataset<Row> predictions = applyMLModel(inputData, job);
            
            // Write results back to Kafka and data lake
            writeResults(predictions, job);
            
            // Update job status
            job.setEndTime(LocalDateTime.now());
            job.setStatus(BatchJob.Status.COMPLETED);
            job.setRecordsProcessed(predictions.count());
            
            logger.info("Batch inference job {} completed successfully. Processed {} records", 
                       jobId, job.getRecordsProcessed());
            
        } catch (Exception e) {
            logger.error("Batch inference job {} failed", jobId, e);
            job.setEndTime(LocalDateTime.now());
            job.setStatus(BatchJob.Status.FAILED);
            job.setErrorMessage(e.getMessage());
        }

        return CompletableFuture.completedFuture(job);
    }

    /**
     * Process real-time batch data from Kafka stream
     */
    private void processBatchData(Dataset<Row> batchDF, long batchId) {
        try {
            logger.info("Processing streaming batch {} with {} records", batchId, batchDF.count());
            
            // Parse Kafka messages
            Dataset<Row> parsedData = batchDF
                .selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)", "timestamp")
                .filter("value IS NOT NULL");

            if (parsedData.count() == 0) {
                logger.debug("No valid records in batch {}", batchId);
                return;
            }

            // Apply ML model to streaming data
            Dataset<Row> predictions = applyMLModel(parsedData, 
                BatchJob.builder()
                    .jobId("streaming-" + batchId)
                    .startTime(LocalDateTime.now())
                    .build());

            // Write results to output topic
            writeStreamingResults(predictions, batchId);
            
        } catch (Exception e) {
            logger.error("Failed to process batch {}", batchId, e);
        }
    }

    /**
     * Load input data from multiple sources
     * Combines Kafka events, data lake, and external sources
     */
    private Dataset<Row> loadInputData(BatchJob job) {
        logger.info("Loading input data for job: {}", job.getJobId());
        
        // Load from data lake (historical data)
        Dataset<Row> historicalData = dataLakeService.loadHistoricalData(
            job.getStartTime().minusHours(24), // Last 24 hours
            job.getStartTime()
        );
        
        // Load from Kafka topics (recent events)
        Dataset<Row> eventData = sparkSession
            .read()
            .format("kafka")
            .option("kafka.bootstrap.servers", kafkaBootstrapServers)
            .option("subscribe", String.join(",", 
                KafkaConfig.Topics.USER_EVENTS,
                KafkaConfig.Topics.TRANSACTION_EVENTS,
                KafkaConfig.Topics.CREDIT_EVENTS,
                KafkaConfig.Topics.JOURNEY_EVENTS))
            .option("startingOffsets", "earliest")
            .load();

        // Combine and transform data
        Dataset<Row> combinedData = historicalData.union(
            eventData.selectExpr(
                "CAST(key AS STRING)",
                "CAST(value AS STRING)",
                "timestamp"
            )
        );

        logger.info("Loaded {} records for batch processing", combinedData.count());
        return combinedData;
    }

    /**
     * Apply ML model for batch inference
     * Supports multiple model types and versions
     */
    private Dataset<Row> applyMLModel(Dataset<Row> inputData, BatchJob job) {
        logger.info("Applying ML model for job: {}", job.getJobId());
        
        try {
            // Get the latest model version
            String modelVersion = modelRegistryService.getLatestModelVersion("credit-risk-model");
            
            // Feature engineering pipeline
            Dataset<Row> features = createFeatures(inputData);
            
            // Load model and apply predictions
            // This would integrate with MLflow or Azure ML model registry
            Dataset<Row> predictions = features
                .withColumn("credit_score", 
                    // Placeholder for actual model prediction
                    org.apache.spark.sql.functions.rand().multiply(850))
                .withColumn("risk_category", 
                    org.apache.spark.sql.functions.when(
                        org.apache.spark.sql.functions.col("credit_score").gt(750), "LOW")
                    .when(org.apache.spark.sql.functions.col("credit_score").gt(650), "MEDIUM")
                    .otherwise("HIGH"))
                .withColumn("model_version", org.apache.spark.sql.functions.lit(modelVersion))
                .withColumn("prediction_timestamp", 
                    org.apache.spark.sql.functions.current_timestamp());

            logger.info("Generated {} predictions for job: {}", predictions.count(), job.getJobId());
            return predictions;
            
        } catch (Exception e) {
            logger.error("Failed to apply ML model for job: {}", job.getJobId(), e);
            throw new RuntimeException("Model application failed", e);
        }
    }

    /**
     * Feature engineering pipeline
     * Creates ML features from raw event data
     */
    private Dataset<Row> createFeatures(Dataset<Row> rawData) {
        // Implement feature engineering logic
        // This is a simplified example - real implementation would be more complex
        return rawData
            .withColumn("feature_1", org.apache.spark.sql.functions.rand())
            .withColumn("feature_2", org.apache.spark.sql.functions.rand())
            .withColumn("feature_3", org.apache.spark.sql.functions.rand());
    }

    /**
     * Write batch results to Kafka and data lake
     */
    private void writeResults(Dataset<Row> predictions, BatchJob job) {
        logger.info("Writing results for job: {}", job.getJobId());
        
        try {
            // Write to Kafka output topic
            predictions
                .selectExpr("CAST(NULL AS STRING) as key", "to_json(struct(*)) as value")
                .write()
                .format("kafka")
                .option("kafka.bootstrap.servers", kafkaBootstrapServers)
                .option("topic", KafkaConfig.Topics.BATCH_INFERENCE_OUTPUT)
                .save();

            // Write to data lake for historical analysis
            dataLakeService.writePredictions(predictions, job.getJobId());
            
            logger.info("Results written successfully for job: {}", job.getJobId());
            
        } catch (Exception e) {
            logger.error("Failed to write results for job: {}", job.getJobId(), e);
            throw new RuntimeException("Result writing failed", e);
        }
    }

    /**
     * Write streaming results to Kafka
     */
    private void writeStreamingResults(Dataset<Row> predictions, long batchId) {
        try {
            predictions
                .selectExpr("CAST(NULL AS STRING) as key", "to_json(struct(*)) as value")
                .write()
                .format("kafka")
                .option("kafka.bootstrap.servers", kafkaBootstrapServers)
                .option("topic", KafkaConfig.Topics.BATCH_INFERENCE_OUTPUT)
                .save();
                
            logger.info("Streaming results written for batch: {}", batchId);
            
        } catch (Exception e) {
            logger.error("Failed to write streaming results for batch: {}", batchId, e);
        }
    }

    /**
     * Publish job metrics to monitoring system
     */
    private void publishJobMetrics(BatchJob job) {
        try {
            String metrics = String.format(
                "{\"jobId\":\"%s\",\"status\":\"%s\",\"recordsProcessed\":%d,\"duration\":%d}",
                job.getJobId(),
                job.getStatus(),
                job.getRecordsProcessed(),
                job.getDurationSeconds()
            );
            
            kafkaTemplate.send(KafkaConfig.Topics.BATCH_METRICS, metrics);
            logger.info("Published metrics for job: {}", job.getJobId());
            
        } catch (Exception e) {
            logger.error("Failed to publish metrics for job: {}", job.getJobId(), e);
        }
    }

    /**
     * Cleanup resources
     */
    @PreDestroy
    public void cleanup() {
        try {
            if (streamingQuery != null && streamingQuery.isActive()) {
                logger.info("Stopping batch inference streaming query");
                streamingQuery.stop();
            }
            
            if (sparkSession != null) {
                logger.info("Stopping Spark session");
                sparkSession.stop();
            }
            
        } catch (Exception e) {
            logger.error("Error during cleanup", e);
        }
    }
}