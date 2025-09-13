package com.fintech.batch.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka Configuration for Batch Inference Service
 * 
 * Optimized for high-throughput batch processing with:
 * - Large batch sizes for efficiency
 * - Extended timeouts for batch operations
 * - Consumer groups for scalable processing
 * - Producer optimizations for batch writes
 */
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id:batch-inference-group}")
    private String groupId;

    @Value("${spring.kafka.consumer.auto-offset-reset:earliest}")
    private String autoOffsetReset;

    @Value("${spring.kafka.consumer.enable-auto-commit:false}")
    private boolean enableAutoCommit;

    @Value("${spring.kafka.consumer.max-poll-records:10000}")
    private int maxPollRecords;

    @Value("${spring.kafka.consumer.fetch-max-wait:5000}")
    private int fetchMaxWait;

    @Value("${spring.kafka.producer.batch-size:65536}")
    private int batchSize;

    @Value("${spring.kafka.producer.linger-ms:100}")
    private int lingerMs;

    @Value("${spring.kafka.producer.buffer-memory:67108864}")
    private long bufferMemory;

    /**
     * Consumer Factory optimized for batch processing
     * Large batch sizes and extended timeouts for efficiency
     */
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // Basic configuration
        configProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        configProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        configProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, enableAutoCommit);
        
        // Batch processing optimizations
        configProps.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, maxPollRecords);
        configProps.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, fetchMaxWait);
        configProps.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 50000); // Wait for 50KB
        configProps.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG, 10485760); // 10MB per partition
        
        // Session and heartbeat configuration for batch processing
        configProps.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 300000); // 5 minutes
        configProps.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 30000); // 30 seconds
        configProps.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 1800000); // 30 minutes
        
        // Performance optimizations
        configProps.put(ConsumerConfig.RECEIVE_BUFFER_CONFIG, 262144); // 256KB
        configProps.put(ConsumerConfig.SEND_BUFFER_CONFIG, 131072); // 128KB
        
        return new DefaultKafkaConsumerFactory<>(configProps);
    }

    /**
     * Producer Factory optimized for batch writes
     * High throughput configuration with batching
     */
    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // Basic configuration
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // Batch processing optimizations
        configProps.put(ProducerConfig.BATCH_SIZE_CONFIG, batchSize);
        configProps.put(ProducerConfig.LINGER_MS_CONFIG, lingerMs);
        configProps.put(ProducerConfig.BUFFER_MEMORY_CONFIG, bufferMemory);
        
        // Throughput optimizations
        configProps.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
        configProps.put(ProducerConfig.ACKS_CONFIG, "1"); // Leader acknowledgment only for throughput
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        configProps.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 1000);
        
        // Performance tuning
        configProps.put(ProducerConfig.SEND_BUFFER_CONFIG, 131072); // 128KB
        configProps.put(ProducerConfig.RECEIVE_BUFFER_CONFIG, 65536); // 64KB
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    /**
     * Kafka Template for batch processing
     */
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /**
     * Kafka Listener Container Factory optimized for batch processing
     * Configured for large batch sizes and manual acknowledgment
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        
        factory.setConsumerFactory(consumerFactory());
        
        // Container properties for batch processing
        ContainerProperties containerProps = factory.getContainerProperties();
        containerProps.setAckMode(ContainerProperties.AckMode.MANUAL); // Manual acknowledgment
        containerProps.setPollTimeout(10000); // 10 seconds poll timeout
        containerProps.setIdleEventInterval(60000L); // 1 minute idle event
        
        // Concurrency for scalable processing
        factory.setConcurrency(3); // 3 concurrent consumers
        factory.setBatchListener(true); // Enable batch processing
        
        return factory;
    }

    /**
     * Streaming Consumer Factory optimized for low-latency processing
     * Minimal batch sizes and reduced timeouts for real-time performance
     */
    @Bean("streamingConsumerFactory")
    public ConsumerFactory<String, String> streamingConsumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // Basic configuration
        configProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ConsumerConfig.GROUP_ID_CONFIG, "streaming-inference-group");
        configProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        configProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        
        // Low-latency optimizations
        configProps.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 1000); // Smaller batches
        configProps.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, 100); // Minimal wait time
        configProps.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1); // Process immediately
        configProps.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG, 1048576); // 1MB per partition
        
        // Reduced timeouts for streaming
        configProps.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000); // 30 seconds
        configProps.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000); // 3 seconds
        configProps.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 60000); // 1 minute
        
        // Performance optimizations for streaming
        configProps.put(ConsumerConfig.RECEIVE_BUFFER_CONFIG, 65536); // 64KB
        configProps.put(ConsumerConfig.SEND_BUFFER_CONFIG, 32768); // 32KB
        
        return new DefaultKafkaConsumerFactory<>(configProps);
    }

    /**
     * Streaming Producer Factory optimized for low-latency writes
     * Minimal batching and immediate sends for real-time responses
     */
    @Bean("streamingProducerFactory")
    public ProducerFactory<String, String> streamingProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // Basic configuration
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // Low-latency optimizations
        configProps.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384); // Smaller batch size
        configProps.put(ProducerConfig.LINGER_MS_CONFIG, 1); // Minimal linger time
        configProps.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432); // 32MB buffer
        
        // Streaming throughput optimizations
        configProps.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4"); // Faster compression
        configProps.put(ProducerConfig.ACKS_CONFIG, "1"); // Leader acknowledgment only
        configProps.put(ProducerConfig.RETRIES_CONFIG, 1); // Minimal retries for speed
        configProps.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 100);
        
        // Performance tuning for streaming
        configProps.put(ProducerConfig.SEND_BUFFER_CONFIG, 65536); // 64KB
        configProps.put(ProducerConfig.RECEIVE_BUFFER_CONFIG, 32768); // 32KB
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    /**
     * Streaming Kafka Template for real-time processing
     */
    @Bean("streamingKafkaTemplate")
    public KafkaTemplate<String, String> streamingKafkaTemplate() {
        return new KafkaTemplate<>(streamingProducerFactory());
    }

    /**
     * Streaming Kafka Listener Container Factory optimized for low-latency processing
     * Configured for immediate processing and minimal batch sizes
     */
    @Bean("streamingKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, String> streamingKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        
        factory.setConsumerFactory(streamingConsumerFactory());
        
        // Container properties for streaming
        ContainerProperties containerProps = factory.getContainerProperties();
        containerProps.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE); // Immediate acknowledgment
        containerProps.setPollTimeout(1000); // 1 second poll timeout
        containerProps.setIdleEventInterval(10000L); // 10 seconds idle event
        
        // Higher concurrency for streaming workloads
        factory.setConcurrency(5); // 5 concurrent consumers
        factory.setBatchListener(false); // Individual message processing
        
        return factory;
    }

    /**
     * Topics Configuration
     * Defines the Kafka topics used for batch inference
     */
    public static class Topics {
        // Batch processing topics
        public static final String BATCH_INFERENCE_INPUT = "batch-inference-input";
        public static final String BATCH_INFERENCE_OUTPUT = "batch-inference-output";
        public static final String BATCH_JOB_CONTROL = "batch-job-control";
        public static final String BATCH_METRICS = "batch-metrics";
        public static final String MODEL_UPDATES = "model-updates";
        
        // Streaming processing topics for near real-time inference
        public static final String REALTIME_INFERENCE_INPUT = "realtime-inference-input";
        public static final String REALTIME_INFERENCE_OUTPUT = "realtime-inference-output";
        public static final String REALTIME_METRICS = "realtime-metrics";
        public static final String REALTIME_ALERTS = "realtime-alerts";
        public static final String PRIORITY_INFERENCE = "priority-inference";
        
        // Event sourcing topics from other services
        public static final String USER_EVENTS = "user-events";
        public static final String TRANSACTION_EVENTS = "transaction-events";
        public static final String CREDIT_EVENTS = "credit-events";
        public static final String JOURNEY_EVENTS = "journey-events";
        
        // Cross-cutting concern topics
        public static final String DEAD_LETTER_QUEUE = "inference-dlq";
        public static final String AUDIT_EVENTS = "audit-events";
    }
}