package com.fintech.journey.service;

import com.fintech.journey.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Core Journey Orchestrator Service
 * 
 * This service listens to journey events and orchestrates the next steps
 * in user journeys by publishing appropriate events to trigger downstream services.
 */
@Service
public class JourneyOrchestratorService {

    private static final Logger logger = LoggerFactory.getLogger(JourneyOrchestratorService.class);
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * Handle loan application submitted event
     * Triggers credit check initiation
     */
    @KafkaListener(topics = "user.journey.events", containerFactory = "kafkaListenerContainerFactory")
    public void handleLoanApplicationSubmitted(LoanApplicationSubmittedEvent event) {
        logger.info("Orchestrating loan application for journey: {} user: {}", 
                   event.getJourneyId(), event.getUserId());
        
        try {
            // Extract application data
            var applicationData = event.getApplicationData();
            var applicantProfile = event.getApplicantProfile();
            
            // Create credit check request
            var creditCheckRequest = new CreditCheckInitiatedEvent.CreditCheckRequest(
                applicantProfile.getSsn(),
                applicantProfile.getFirstName(),
                applicantProfile.getLastName(),
                applicantProfile.getDateOfBirth(),
                applicationData.getRequestedAmount(),
                formatAddress(applicantProfile.getAddress()),
                "HARD_PULL", // Credit check type
                "EXPERIAN"   // Default provider
            );
            
            // Create and publish credit check initiated event
            var creditCheckEvent = new CreditCheckInitiatedEvent(
                event.getJourneyId(),
                event.getUserId(),
                generateApplicationId(), 
                creditCheckRequest
            );
            
            kafkaTemplate.send("credit.events", creditCheckEvent);
            logger.info("Credit check initiated for journey: {}", event.getJourneyId());
            
        } catch (Exception e) {
            logger.error("Failed to orchestrate loan application for journey: {}", 
                        event.getJourneyId(), e);
            // TODO: Publish error event or compensation logic
        }
    }
    
    /**
     * Handle credit decision made event
     * Triggers contract generation for approved applications
     */
    @KafkaListener(topics = "credit.events", containerFactory = "kafkaListenerContainerFactory")
    public void handleCreditDecisionMade(CreditDecisionMadeEvent event) {
        logger.info("Processing credit decision for journey: {} decision: {}", 
                   event.getJourneyId(), event.getCreditDecision().getDecision());
        
        try {
            String decision = event.getCreditDecision().getDecision();
            
            if ("APPROVED".equals(decision)) {
                // Trigger contract generation
                var contractEvent = createContractGenerationEvent(event);
                kafkaTemplate.send("contract.events", contractEvent);
                logger.info("Contract generation triggered for approved loan: {}", event.getJourneyId());
                
            } else if ("DECLINED".equals(decision)) {
                // Trigger decline notification
                var declineEvent = createDeclineNotificationEvent(event);
                kafkaTemplate.send("notification.events", declineEvent);
                logger.info("Decline notification triggered for journey: {}", event.getJourneyId());
                
            } else if ("CONDITIONAL".equals(decision)) {
                // Trigger conditional approval notification
                var conditionalEvent = createConditionalApprovalEvent(event);
                kafkaTemplate.send("notification.events", conditionalEvent);
                logger.info("Conditional approval notification triggered for journey: {}", event.getJourneyId());
            }
            
        } catch (Exception e) {
            logger.error("Failed to process credit decision for journey: {}", 
                        event.getJourneyId(), e);
            // TODO: Publish error event or compensation logic
        }
    }
    
    /**
     * Generate unique application ID
     */
    private String generateApplicationId() {
        return "APP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    /**
     * Format address for credit check
     */
    private String formatAddress(LoanApplicationSubmittedEvent.Address address) {
        if (address == null) {
            return "";
        }
        return String.format("%s, %s, %s %s", 
            address.getStreet(), 
            address.getCity(), 
            address.getState(), 
            address.getZipCode());
    }
    
    /**
     * Create contract generation event for approved loans
     */
    private BaseJourneyEvent createContractGenerationEvent(CreditDecisionMadeEvent event) {
        // For now, create a generic base event
        // In a real implementation, this would be a specific ContractGenerationEvent
        return new BaseJourneyEvent(
            event.getJourneyId(),
            event.getUserId(),
            "contract.generation.requested",
            "journey-orchestrator"
        );
    }
    
    /**
     * Create decline notification event
     */
    private BaseJourneyEvent createDeclineNotificationEvent(CreditDecisionMadeEvent event) {
        return new BaseJourneyEvent(
            event.getJourneyId(),
            event.getUserId(),
            "loan.application.declined",
            "journey-orchestrator"
        );
    }
    
    /**
     * Create conditional approval event
     */
    private BaseJourneyEvent createConditionalApprovalEvent(CreditDecisionMadeEvent event) {
        return new BaseJourneyEvent(
            event.getJourneyId(),
            event.getUserId(),
            "loan.application.conditional",
            "journey-orchestrator"
        );
    }
}