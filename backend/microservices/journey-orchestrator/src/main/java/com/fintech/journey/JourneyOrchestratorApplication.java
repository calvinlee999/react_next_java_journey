package com.fintech.journey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Journey Orchestrator Service - Event-driven orchestration for user journeys
 * 
 * This service orchestrates user journeys by reacting to domain events and 
 * triggering appropriate next steps in the business process.
 */
@SpringBootApplication
@EnableKafka
@EnableDiscoveryClient
public class JourneyOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(JourneyOrchestratorApplication.class, args);
    }
}