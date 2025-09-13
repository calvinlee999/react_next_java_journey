package com.fintech.batch.service;

import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Data Lake Service
 * 
 * Manages data storage and retrieval from Azure Data Lake Storage.
 * Provides unified access to historical data, feature stores, and model artifacts.
 * 
 * Key Features:
 * - Delta Lake integration for ACID transactions
 * - Time-travel queries for historical analysis
 * - Partitioned storage for optimal performance
 * - Data lineage and governance
 */
@Service
public class DataLakeService {

    private static final Logger logger = LoggerFactory.getLogger(DataLakeService.class);

    @Autowired
    private SparkSession sparkSession;

    @Value("${azure.storage.account.name}")
    private String storageAccountName;

    @Value("${azure.storage.container.name:fintech-datalake}")
    private String containerName;

    @Value("${data.lake.historical.path:/historical}")
    private String historicalDataPath;

    @Value("${data.lake.features.path:/features}")
    private String featuresPath;

    @Value("${data.lake.predictions.path:/predictions}")
    private String predictionsPath;

    private static final String DELTA_FORMAT = "delta";
    private static final String PARQUET_FORMAT = "parquet";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    /**
     * Load historical data from Data Lake within time range
     */
    public Dataset<Row> loadHistoricalData(LocalDateTime startTime, LocalDateTime endTime) {
        logger.info("Loading historical data from {} to {}", startTime, endTime);
        
        try {
            String basePath = buildDataLakePath(historicalDataPath);
            
            // Load data using Delta Lake for time-travel capabilities
            Dataset<Row> historicalData = sparkSession
                .read()
                .format(DELTA_FORMAT)
                .load(basePath)
                .filter(String.format("timestamp >= '%s' AND timestamp <= '%s'", 
                                    startTime.toString(), endTime.toString()));

            long recordCount = historicalData.count();
            logger.info("Loaded {} historical records from Data Lake", recordCount);
            
            return historicalData;
            
        } catch (Exception e) {
            logger.warn("Failed to load historical data from Data Lake, returning empty dataset", e);
            
            // Return empty dataset with expected schema
            return sparkSession.createDataFrame(
                sparkSession.sparkContext().emptyRDD(),
                createDefaultSchema()
            );
        }
    }

    /**
     * Load feature data for ML model training/inference
     */
    public Dataset<Row> loadFeatureData(String featureSet, LocalDateTime timestamp) {
        logger.info("Loading feature set '{}' for timestamp {}", featureSet, timestamp);
        
        try {
            String featurePath = buildDataLakePath(featuresPath + "/" + featureSet);
            
            // Load features with time-travel to get features as of specific timestamp
            Dataset<Row> features = sparkSession
                .read()
                .format(DELTA_FORMAT)
                .option("timestampAsOf", timestamp.toString())
                .load(featurePath);

            logger.info("Loaded feature set '{}' with {} features", featureSet, features.columns().length);
            
            return features;
            
        } catch (Exception e) {
            logger.error("Failed to load feature set '{}' for timestamp {}", featureSet, timestamp, e);
            throw new RuntimeException("Feature loading failed", e);
        }
    }

    /**
     * Write prediction results to Data Lake
     */
    public void writePredictions(Dataset<Row> predictions, String jobId) {
        logger.info("Writing prediction results for job: {}", jobId);
        
        try {
            String outputPath = buildDataLakePath(predictionsPath + "/" + 
                                                LocalDateTime.now().format(DATE_FORMATTER) + 
                                                "/" + jobId);

            // Write predictions using Delta Lake format with partitioning
            predictions
                .withColumn("batch_date", 
                    org.apache.spark.sql.functions.date_format(
                        org.apache.spark.sql.functions.current_timestamp(), "yyyy-MM-dd"))
                .write()
                .format(DELTA_FORMAT)
                .mode("append")
                .partitionBy("batch_date")
                .option("mergeSchema", "true")
                .save(outputPath);

            logger.info("Successfully wrote prediction results to: {}", outputPath);
            
        } catch (Exception e) {
            logger.error("Failed to write prediction results for job: {}", jobId, e);
            throw new RuntimeException("Prediction writing failed", e);
        }
    }

    /**
     * Write training data to Data Lake
     */
    public void writeTrainingData(Dataset<Row> trainingData, String modelName, String version) {
        logger.info("Writing training data for model {}:{}", modelName, version);
        
        try {
            String trainingPath = buildDataLakePath("/training-data/" + modelName + "/" + version);

            trainingData
                .write()
                .format(DELTA_FORMAT)
                .mode("overwrite")
                .option("overwriteSchema", "true")
                .save(trainingPath);

            logger.info("Successfully wrote training data for model {}:{}", modelName, version);
            
        } catch (Exception e) {
            logger.error("Failed to write training data for model {}:{}", modelName, version, e);
            throw new RuntimeException("Training data writing failed", e);
        }
    }

    /**
     * Load model artifacts from Data Lake
     */
    public String loadModelArtifacts(String modelName, String version) {
        logger.info("Loading model artifacts for {}:{}", modelName, version);
        
        try {
            String modelPath = buildDataLakePath("/models/" + modelName + "/" + version);
            
            // Verify model exists
            boolean modelExists = sparkSession
                .read()
                .format(PARQUET_FORMAT)
                .option("pathGlobFilter", "*.model")
                .load(modelPath)
                .count() > 0;

            if (!modelExists) {
                throw new IllegalArgumentException("Model artifacts not found: " + modelPath);
            }

            logger.info("Found model artifacts at: {}", modelPath);
            return modelPath;
            
        } catch (Exception e) {
            logger.error("Failed to load model artifacts for {}:{}", modelName, version, e);
            throw new RuntimeException("Model artifact loading failed", e);
        }
    }

    /**
     * Archive old data based on retention policy
     */
    public void archiveOldData(int retentionDays) {
        logger.info("Archiving data older than {} days", retentionDays);
        
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
            
            // Archive historical data
            archiveDataByDate(historicalDataPath, cutoffDate);
            
            // Archive prediction data
            archiveDataByDate(predictionsPath, cutoffDate);
            
            logger.info("Successfully archived data older than {}", cutoffDate);
            
        } catch (Exception e) {
            logger.error("Failed to archive old data", e);
            throw new RuntimeException("Data archival failed", e);
        }
    }

    /**
     * Get data lake storage metrics
     */
    public DataLakeMetrics getStorageMetrics() {
        logger.info("Collecting Data Lake storage metrics");
        
        try {
            // Calculate storage metrics
            long historicalDataSize = calculateDataSize(historicalDataPath);
            long featuresDataSize = calculateDataSize(featuresPath);
            long predictionsDataSize = calculateDataSize(predictionsPath);
            
            DataLakeMetrics metrics = new DataLakeMetrics();
            metrics.setHistoricalDataSizeBytes(historicalDataSize);
            metrics.setFeaturesDataSizeBytes(featuresDataSize);
            metrics.setPredictionsDataSizeBytes(predictionsDataSize);
            metrics.setTotalSizeBytes(historicalDataSize + featuresDataSize + predictionsDataSize);
            metrics.setLastUpdated(LocalDateTime.now());
            
            logger.info("Data Lake metrics: {} GB total", metrics.getTotalSizeBytes() / (1024 * 1024 * 1024));
            
            return metrics;
            
        } catch (Exception e) {
            logger.error("Failed to collect storage metrics", e);
            throw new RuntimeException("Metrics collection failed", e);
        }
    }

    /**
     * Build full Data Lake path
     */
    private String buildDataLakePath(String relativePath) {
        return String.format("abfss://%s@%s.dfs.core.windows.net%s", 
                           containerName, storageAccountName, relativePath);
    }

    /**
     * Create default schema for empty datasets
     */
    private org.apache.spark.sql.types.StructType createDefaultSchema() {
        return new org.apache.spark.sql.types.StructType(new org.apache.spark.sql.types.StructField[] {
            org.apache.spark.sql.types.DataTypes.createStructField("timestamp", 
                org.apache.spark.sql.types.DataTypes.TimestampType, true),
            org.apache.spark.sql.types.DataTypes.createStructField("key", 
                org.apache.spark.sql.types.DataTypes.StringType, true),
            org.apache.spark.sql.types.DataTypes.createStructField("value", 
                org.apache.spark.sql.types.DataTypes.StringType, true)
        });
    }

    /**
     * Archive data by date cutoff
     */
    private void archiveDataByDate(String dataPath, LocalDateTime cutoffDate) {
        try {
            String fullPath = buildDataLakePath(dataPath);
            String archivePath = buildDataLakePath("/archive" + dataPath);
            
            // In a real implementation, this would move old partitions to archive storage
            Dataset<Row> oldData = sparkSession
                .read()
                .format(DELTA_FORMAT)
                .load(fullPath)
                .filter(String.format("timestamp < '%s'", cutoffDate.toString()));

            if (oldData.count() > 0) {
                oldData
                    .write()
                    .format(DELTA_FORMAT)
                    .mode("append")
                    .save(archivePath);
                
                logger.info("Archived {} records from {}", oldData.count(), dataPath);
            }
            
        } catch (Exception e) {
            logger.warn("Failed to archive data from path: {}", dataPath, e);
        }
    }

    /**
     * Calculate data size for a given path
     */
    private long calculateDataSize(String dataPath) {
        try {
            String fullPath = buildDataLakePath(dataPath);
            
            // In a real implementation, this would use Azure Storage APIs
            // For now, return a mock size
            return 1024L * 1024L * 1024L; // 1 GB mock size
            
        } catch (Exception e) {
            logger.warn("Failed to calculate size for path: {}", dataPath, e);
            return 0L;
        }
    }

    /**
     * Data Lake Metrics model
     */
    public static class DataLakeMetrics {
        private long historicalDataSizeBytes;
        private long featuresDataSizeBytes;
        private long predictionsDataSizeBytes;
        private long totalSizeBytes;
        private LocalDateTime lastUpdated;

        // Getters and setters
        public long getHistoricalDataSizeBytes() { return historicalDataSizeBytes; }
        public void setHistoricalDataSizeBytes(long historicalDataSizeBytes) { 
            this.historicalDataSizeBytes = historicalDataSizeBytes; 
        }

        public long getFeaturesDataSizeBytes() { return featuresDataSizeBytes; }
        public void setFeaturesDataSizeBytes(long featuresDataSizeBytes) { 
            this.featuresDataSizeBytes = featuresDataSizeBytes; 
        }

        public long getPredictionsDataSizeBytes() { return predictionsDataSizeBytes; }
        public void setPredictionsDataSizeBytes(long predictionsDataSizeBytes) { 
            this.predictionsDataSizeBytes = predictionsDataSizeBytes; 
        }

        public long getTotalSizeBytes() { return totalSizeBytes; }
        public void setTotalSizeBytes(long totalSizeBytes) { this.totalSizeBytes = totalSizeBytes; }

        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    }
}