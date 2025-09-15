package com.fintech.journey.agentic;

import com.fintech.journey.events.BaseJourneyEvent;
import com.fintech.journey.events.LoanApplicationSubmittedEvent;
import com.fintech.journey.events.CreditDecisionMadeEvent;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Agentic Workflow Engine
 * 
 * Creates intelligent workflow plans based on journey events and business rules.
 * Uses AI-driven decision making to determine optimal workflow paths and tool selection.
 */
@Component
public class AgenticWorkflowEngine {
    
    /**
     * Creates an intelligent workflow plan based on the journey event
     */
    public AgenticWorkflowPlan createWorkflowPlan(BaseJourneyEvent event) {
        if (event instanceof LoanApplicationSubmittedEvent loanEvent) {
            return createLoanApplicationWorkflow(loanEvent);
        } else if (event instanceof CreditDecisionMadeEvent creditEvent) {
            return createCreditDecisionWorkflow(creditEvent);
        }
        
        // Default workflow for unknown events
        return createDefaultWorkflow(event);
    }
    
    private AgenticWorkflowPlan createLoanApplicationWorkflow(LoanApplicationSubmittedEvent event) {
        List<AgenticWorkflowStep> steps = List.of(
            // Step 1: User profile validation
            new AgenticWorkflowStep(
                "validate_user_profile",
                "get_user_profile",
                Map.of("userId", event.getUserId()),
                List.of("user-management"),
                true, // recoverable
                3, // max retries
                List.of("verify_user_account"), // alternative tools
                false, // no coordination needed
                Map.of()
            ),
            
            // Step 2: Fraud detection
            new AgenticWorkflowStep(
                "fraud_detection_check",
                "detect_transaction_fraud",
                Map.of(
                    "transactionAmount", event.getApplicationData().getRequestedAmount().toString(),
                    "merchantCategory", "LOAN_APPLICATION",
                    "userId", event.getUserId(),
                    "location", "ONLINE",
                    "paymentMethod", "ACH",
                    "hourOfDay", java.time.LocalDateTime.now().getHour()
                ),
                List.of("ai-inference", "risk-management"),
                true,
                2,
                List.of(), // no alternatives for fraud detection
                true, // requires coordination
                Map.of("riskThreshold", 0.5, "blockOnHigh", true)
            ),
            
            // Step 3: Credit risk assessment
            new AgenticWorkflowStep(
                "credit_risk_assessment",
                "assess_credit_risk",
                Map.of(
                    "userId", event.getUserId(),
                    "loanAmount", event.getApplicationData().getRequestedAmount().toString(),
                    "annualIncome", event.getApplicantProfile().getAnnualIncome().toString(),
                    "currentDebt", "0", // Would be retrieved from credit bureau
                    "employmentLength", 12 // Default or from user profile
                ),
                List.of("ai-inference", "credit-bureau"),
                true,
                2,
                List.of("manual_credit_review"), // fallback to manual review
                true,
                Map.of("scoreThreshold", 650, "requireManualReview", false)
            ),
            
            // Step 4: Journey coordination
            new AgenticWorkflowStep(
                "coordinate_approval_workflow",
                "coordinate_multi_domain_workflow",
                Map.of(
                    "workflowId", event.getJourneyId(),
                    "userId", event.getUserId(),
                    "workflowType", "LOAN_APPROVAL",
                    "domains", "user-management,ai-inference,document-management,notification",
                    "configJson", "{\"autoApprovalLimit\": 50000, \"requireDocuments\": true}"
                ),
                List.of("journey-orchestration", "document-management", "notification"),
                true,
                1,
                List.of(),
                true,
                Map.of("approvalRequired", true, "documentsNeeded", List.of("income_verification", "identity"))
            )
        );
        
        return new AgenticWorkflowPlan(
            "LOAN_APPLICATION_PROCESSING",
            steps,
            Map.of(
                "journeyId", event.getJourneyId(),
                "userId", event.getUserId(),
                "loanAmount", event.getApplicationData().getRequestedAmount(),
                "priority", "STANDARD"
            )
        );
    }
    
    private AgenticWorkflowPlan createCreditDecisionWorkflow(CreditDecisionMadeEvent event) {
        List<AgenticWorkflowStep> steps = List.of(
            // Step 1: Update user status based on decision
            new AgenticWorkflowStep(
                "update_user_loan_status",
                "update_user_status",
                Map.of(
                    "userId", event.getUserId(),
                    "newStatus", event.getDecision().equals("APPROVED") ? "LOAN_APPROVED" : "LOAN_DENIED",
                    "reason", "Credit decision: " + event.getDecision()
                ),
                List.of("user-management"),
                true,
                3,
                List.of(),
                false,
                Map.of()
            ),
            
            // Step 2: Generate appropriate documents
            new AgenticWorkflowStep(
                "generate_decision_documents",
                "generate_loan_documents",
                Map.of(
                    "journeyId", event.getJourneyId(),
                    "userId", event.getUserId(),
                    "decision", event.getDecision(),
                    "creditScore", event.getCreditScore(),
                    "conditions", event.getConditions()
                ),
                List.of("document-management"),
                true,
                2,
                List.of("manual_document_generation"),
                true,
                Map.of("documentType", event.getDecision().equals("APPROVED") ? "APPROVAL_LETTER" : "DENIAL_LETTER")
            )
        );
        
        return new AgenticWorkflowPlan(
            "CREDIT_DECISION_PROCESSING",
            steps,
            Map.of(
                "journeyId", event.getJourneyId(),
                "userId", event.getUserId(),
                "decision", event.getDecision(),
                "priority", "HIGH"
            )
        );
    }
    
    private AgenticWorkflowPlan createDefaultWorkflow(BaseJourneyEvent event) {
        List<AgenticWorkflowStep> steps = List.of(
            new AgenticWorkflowStep(
                "generic_event_processing",
                "process_generic_event",
                Map.of(
                    "eventType", event.getClass().getSimpleName(),
                    "journeyId", event.getJourneyId(),
                    "userId", event.getUserId()
                ),
                List.of("journey-orchestration"),
                true,
                1,
                List.of(),
                false,
                Map.of()
            )
        );
        
        return new AgenticWorkflowPlan(
            "GENERIC_EVENT_PROCESSING",
            steps,
            Map.of(
                "journeyId", event.getJourneyId(),
                "userId", event.getUserId(),
                "priority", "LOW"
            )
        );
    }
}