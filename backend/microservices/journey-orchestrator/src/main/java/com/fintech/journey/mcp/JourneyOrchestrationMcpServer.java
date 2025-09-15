package com.fintech.journey.mcp;

import com.fintech.mcp.core.McpServer;
import com.fintech.mcp.core.McpToolDefinition;
import com.fintech.mcp.core.McpParameter;
import com.fintech.journey.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Map;
import java.util.List;

/**
 * Journey Orchestration MCP Server
 * 
 * Exposes user journey orchestration capabilities as MCP tools for AI agents.
 * This enables agents to initiate and manage complex multi-step financial workflows
 * across multiple domains using event-driven architecture.
 */
@Service
@McpServer(
    name = "journey-orchestration-server",
    description = "User journey orchestration and workflow automation for AI agents",
    domain = "journey-orchestration",
    version = "1.0.0"
)
public class JourneyOrchestrationMcpServer {
    
    private static final Logger logger = LoggerFactory.getLogger(JourneyOrchestrationMcpServer.class);
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public JourneyOrchestrationMcpServer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    /**
     * Initiate a loan application journey
     * Business capability: Loan origination workflow automation
     */
    @McpToolDefinition(
        name = "start_loan_application_journey",
        description = "Initiates a complete loan application journey including credit checks, risk assessment, and approval workflow. Returns journey ID for tracking.",
        domain = "journey-orchestration",
        tags = {"loan", "application", "workflow", "origination"},
        isReadOnly = false
    )
    public LoanJourneyResult startLoanApplicationJourney(
            @McpParameter(
                description = "Unique user identifier applying for the loan",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "Requested loan amount in USD",
                required = true
            ) String requestedAmount,
            
            @McpParameter(
                description = "Loan purpose (HOME_PURCHASE, REFINANCE, PERSONAL, BUSINESS)",
                required = true
            ) String loanPurpose,
            
            @McpParameter(
                description = "Loan term in months",
                required = true
            ) Integer termMonths,
            
            @McpParameter(
                description = "Applicant's annual income",
                required = true
            ) String annualIncome,
            
            @McpParameter(
                description = "Applicant's Social Security Number for credit check",
                required = true
            ) String ssn) {
        
        String journeyId = UUID.randomUUID().toString();
        logger.info("Starting loan application journey: {} for user: {} via MCP", journeyId, userId);
        
        try {
            // Create applicant profile
            var applicantProfile = new LoanApplicationSubmittedEvent.ApplicantProfile(
                ssn,
                "First", // In real implementation, get from user service
                "Last",
                null, // Date of birth would come from user profile
                new LoanApplicationSubmittedEvent.Address("", "", "", "", ""), // Address from user profile
                new BigDecimal(annualIncome)
            );
            
            // Create application data
            var applicationData = new LoanApplicationSubmittedEvent.ApplicationData(
                new BigDecimal(requestedAmount),
                loanPurpose,
                termMonths,
                null // Additional data as needed
            );
            
            // Create and publish loan application event
            var loanApplicationEvent = new LoanApplicationSubmittedEvent(
                journeyId,
                userId,
                applicantProfile,
                applicationData,
                System.currentTimeMillis()
            );
            
            kafkaTemplate.send("user.journey.events", loanApplicationEvent);
            
            logger.info("Published loan application event for journey: {}", journeyId);
            
            return new LoanJourneyResult(
                true,
                journeyId,
                userId,
                requestedAmount,
                loanPurpose,
                "INITIATED",
                "Loan application journey started successfully",
                System.currentTimeMillis()
            );
            
        } catch (Exception e) {
            logger.error("Failed to start loan application journey via MCP", e);
            return new LoanJourneyResult(
                false,
                journeyId,
                userId,
                requestedAmount,
                loanPurpose,
                "FAILED",
                "Failed to start journey: " + e.getMessage(),
                System.currentTimeMillis()
            );
        }
    }
    
    /**
     * Process credit decision response
     * Business capability: Credit decision processing and next steps
     */
    @McpToolDefinition(
        name = "process_credit_decision",
        description = "Processes credit decision and triggers appropriate next steps in the loan journey. Handles approval, conditional approval, or rejection scenarios.",
        domain = "journey-orchestration",
        tags = {"credit", "decision", "approval", "underwriting"},
        isReadOnly = false
    )
    public CreditDecisionResult processCreditDecision(
            @McpParameter(
                description = "Journey identifier for the loan application",
                required = true
            ) String journeyId,
            
            @McpParameter(
                description = "User identifier",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "Credit score from credit bureau",
                required = true
            ) Integer creditScore,
            
            @McpParameter(
                description = "Credit decision (APPROVED, CONDITIONAL_APPROVAL, REJECTED)",
                required = true
            ) String decision,
            
            @McpParameter(
                description = "Risk assessment score (0-100)",
                required = true
            ) Integer riskScore,
            
            @McpParameter(
                description = "Conditions for approval (if conditional)",
                required = false
            ) String conditions) {
        
        logger.info("Processing credit decision for journey: {} via MCP", journeyId);
        
        try {
            // Create credit decision event
            var creditDecisionEvent = new CreditDecisionMadeEvent(
                journeyId,
                userId,
                creditScore,
                decision,
                riskScore,
                conditions != null ? conditions : "",
                System.currentTimeMillis()
            );
            
            kafkaTemplate.send("user.journey.events", creditDecisionEvent);
            
            logger.info("Published credit decision event for journey: {}", journeyId);
            
            // Determine next steps based on decision
            String nextSteps = switch (decision.toUpperCase()) {
                case "APPROVED" -> "GENERATE_LOAN_DOCUMENTS";
                case "CONDITIONAL_APPROVAL" -> "COLLECT_ADDITIONAL_DOCUMENTS";
                case "REJECTED" -> "SEND_REJECTION_NOTICE";
                default -> "MANUAL_REVIEW";
            };
            
            return new CreditDecisionResult(
                true,
                journeyId,
                userId,
                creditScore,
                decision,
                riskScore,
                nextSteps,
                conditions,
                "Credit decision processed successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to process credit decision via MCP", e);
            return new CreditDecisionResult(
                false,
                journeyId,
                userId,
                creditScore,
                decision,
                riskScore,
                "ERROR",
                conditions,
                "Failed to process decision: " + e.getMessage()
            );
        }
    }
    
    /**
     * Trigger multi-domain workflow coordination
     * Business capability: Cross-domain event orchestration
     */
    @McpToolDefinition(
        name = "coordinate_multi_domain_workflow",
        description = "Coordinates workflows across multiple business domains (user, payment, risk, compliance). Ensures proper sequencing and error handling.",
        domain = "journey-orchestration",
        tags = {"workflow", "coordination", "multi-domain", "orchestration"},
        isReadOnly = false
    )
    public WorkflowCoordinationResult coordinateMultiDomainWorkflow(
            @McpParameter(
                description = "Unique workflow identifier",
                required = true
            ) String workflowId,
            
            @McpParameter(
                description = "User identifier",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "Workflow type (ONBOARDING, LOAN_APPROVAL, PAYMENT_PROCESSING)",
                required = true
            ) String workflowType,
            
            @McpParameter(
                description = "Participating domains (comma-separated)",
                required = true
            ) String domains,
            
            @McpParameter(
                description = "Workflow configuration parameters (JSON string)",
                required = false
            ) String configJson) {
        
        logger.info("Coordinating multi-domain workflow: {} for user: {} via MCP", workflowId, userId);
        
        try {
            List<String> domainList = List.of(domains.split(","));
            
            // Create workflow coordination event
            var workflowEvent = new WorkflowCoordinationEvent(
                workflowId,
                userId,
                workflowType,
                domainList,
                configJson != null ? configJson : "{}",
                "INITIATED",
                System.currentTimeMillis()
            );
            
            kafkaTemplate.send("user.journey.events", workflowEvent);
            
            logger.info("Published workflow coordination event for: {}", workflowId);
            
            return new WorkflowCoordinationResult(
                true,
                workflowId,
                userId,
                workflowType,
                domainList,
                "INITIATED",
                "Workflow coordination started successfully",
                System.currentTimeMillis()
            );
            
        } catch (Exception e) {
            logger.error("Failed to coordinate multi-domain workflow via MCP", e);
            return new WorkflowCoordinationResult(
                false,
                workflowId,
                userId,
                workflowType,
                List.of(),
                "FAILED",
                "Failed to coordinate workflow: " + e.getMessage(),
                System.currentTimeMillis()
            );
        }
    }
}

// Result DTOs for MCP responses
record LoanJourneyResult(
    boolean success,
    String journeyId,
    String userId,
    String requestedAmount,
    String loanPurpose,
    String status,
    String message,
    long timestamp
) {}

record CreditDecisionResult(
    boolean success,
    String journeyId,
    String userId,
    Integer creditScore,
    String decision,
    Integer riskScore,
    String nextSteps,
    String conditions,
    String message
) {}

record WorkflowCoordinationResult(
    boolean success,
    String workflowId,
    String userId,
    String workflowType,
    List<String> domains,
    String status,
    String message,
    long timestamp
) {}

// Event for workflow coordination
record WorkflowCoordinationEvent(
    String workflowId,
    String userId,
    String workflowType,
    List<String> domains,
    String configJson,
    String status,
    long timestamp
) implements BaseJourneyEvent {
    
    @Override
    public String getJourneyId() {
        return workflowId;
    }
    
    @Override
    public String getUserId() {
        return userId;
    }
    
    @Override
    public long getTimestamp() {
        return timestamp;
    }
}