package com.fintech.journey.agentic;

import com.fintech.mcp.executor.McpToolExecutor;
import com.fintech.mcp.executor.McpExecutionContext;
import com.fintech.mcp.executor.McpExecutionResult;
import com.fintech.journey.events.BaseJourneyEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Agentic Journey Orchestrator
 * 
 * This service combines MCP tool execution with Kafka event-driven architecture
 * to create intelligent, agent-driven workflows across multiple domains.
 * 
 * Key capabilities:
 * - Multi-domain workflow coordination using MCP tools
 * - Event-driven agent decision making
 * - Intelligent error handling and retry logic
 * - Data mesh integration for analytics and insights
 */
@Service
public class AgenticJourneyOrchestrator {
    
    private static final Logger logger = LoggerFactory.getLogger(AgenticJourneyOrchestrator.class);
    
    private static final String AGENT_EVENTS_TOPIC = "agent.workflow.events";
    private static final String DOMAIN_COORDINATION_TOPIC = "domain.coordination.events";
    
    private final McpToolExecutor mcpToolExecutor;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AgenticWorkflowEngine workflowEngine;
    
    public AgenticJourneyOrchestrator(
            McpToolExecutor mcpToolExecutor,
            KafkaTemplate<String, Object> kafkaTemplate,
            AgenticWorkflowEngine workflowEngine) {
        this.mcpToolExecutor = mcpToolExecutor;
        this.kafkaTemplate = kafkaTemplate;
        this.workflowEngine = workflowEngine;
    }
    
    /**
     * Handle loan application events with agentic decision making
     */
    @KafkaListener(topics = "user.journey.events", containerFactory = "kafkaListenerContainerFactory")
    public void handleJourneyEventWithAgent(BaseJourneyEvent event) {
        logger.info("Agentic orchestrator processing journey event for: {}", event.getJourneyId());
        
        // Create execution context for agent operations
        McpExecutionContext context = McpExecutionContext.create(
            event.getUserId(),
            "journey-orchestrator-agent"
        );
        
        // Execute workflow using agent-driven approach
        CompletableFuture.runAsync(() -> {
            try {
                executeAgenticWorkflow(event, context);
            } catch (Exception e) {
                logger.error("Failed to execute agentic workflow for journey: {}", event.getJourneyId(), e);
                handleWorkflowFailure(event, context, e);
            }
        });
    }
    
    private void executeAgenticWorkflow(BaseJourneyEvent event, McpExecutionContext context) {
        String journeyId = event.getJourneyId();
        
        // Determine workflow type and required domains
        AgenticWorkflowPlan plan = workflowEngine.createWorkflowPlan(event);
        
        logger.info("Executing agentic workflow plan for journey: {} with {} steps", 
                   journeyId, plan.steps().size());
        
        // Execute workflow steps using MCP tools
        for (AgenticWorkflowStep step : plan.steps()) {
            try {
                executeWorkflowStep(step, context);
                
                // Publish step completion event
                publishStepCompletionEvent(journeyId, step, true, null);
                
            } catch (Exception e) {
                logger.error("Failed to execute workflow step: {} for journey: {}", 
                           step.stepName(), journeyId, e);
                
                publishStepCompletionEvent(journeyId, step, false, e.getMessage());
                
                // Handle step failure with agent intelligence
                if (!handleStepFailure(step, context, e)) {
                    throw new AgenticWorkflowException("Critical workflow step failed", e);
                }
            }
        }
        
        // Publish workflow completion event
        publishWorkflowCompletionEvent(journeyId, plan, true, null);
    }
    
    private void executeWorkflowStep(AgenticWorkflowStep step, McpExecutionContext context) {
        logger.info("Executing workflow step: {} using tool: {}", step.stepName(), step.mcpToolName());
        
        // Execute MCP tool for this step
        CompletableFuture<McpExecutionResult> toolResult = mcpToolExecutor.executeToolAsync(
            step.mcpToolName(),
            step.parameters(),
            context
        );
        
        // Wait for tool execution and handle result
        toolResult.thenAccept(result -> {
            if (result.success()) {
                logger.info("Successfully executed step: {} in {}ms", 
                           step.stepName(), result.executionTimeMs());
                
                // Store result for next steps
                step.setResult(result.data());
                
                // Trigger next step coordination if needed
                if (step.requiresCoordination()) {
                    coordinateWithOtherDomains(step, context);
                }
                
            } else {
                logger.error("Step execution failed: {} - {}", step.stepName(), result.errorMessage());
                throw new AgenticWorkflowException("Step failed: " + result.errorMessage());
            }
        }).join(); // Block for sequential execution
    }
    
    private void coordinateWithOtherDomains(AgenticWorkflowStep step, McpExecutionContext context) {
        logger.info("Coordinating step: {} with domains: {}", step.stepName(), step.targetDomains());
        
        // Create domain coordination event
        DomainCoordinationEvent coordEvent = new DomainCoordinationEvent(
            context.traceId(),
            step.stepName(),
            step.targetDomains(),
            step.getResult(),
            step.coordinationMetadata(),
            System.currentTimeMillis()
        );
        
        kafkaTemplate.send(DOMAIN_COORDINATION_TOPIC, coordEvent);
    }
    
    private boolean handleStepFailure(AgenticWorkflowStep step, McpExecutionContext context, Exception error) {
        logger.warn("Handling step failure for: {} with agent intelligence", step.stepName());
        
        // Use agent intelligence to determine if this is recoverable
        if (step.isRecoverable() && step.getRetryCount() < step.getMaxRetries()) {
            
            // Intelligent retry with backoff
            int retryCount = step.incrementRetryCount();
            long backoffMs = calculateExponentialBackoff(retryCount);
            
            logger.info("Retrying step: {} (attempt {}/{}) after {}ms", 
                       step.stepName(), retryCount, step.getMaxRetries(), backoffMs);
            
            try {
                Thread.sleep(backoffMs);
                executeWorkflowStep(step, context);
                return true;
                
            } catch (Exception retryError) {
                logger.error("Retry failed for step: {}", step.stepName(), retryError);
            }
        }
        
        // If not recoverable or max retries exceeded, try alternative approach
        return tryAlternativeApproach(step, context, error);
    }
    
    private boolean tryAlternativeApproach(AgenticWorkflowStep step, McpExecutionContext context, Exception error) {
        // Agent intelligence: try alternative MCP tools or workflows
        List<String> alternativeTools = step.getAlternativeTools();
        
        for (String alternativeTool : alternativeTools) {
            try {
                logger.info("Trying alternative tool: {} for step: {}", alternativeTool, step.stepName());
                
                // Create modified step with alternative tool
                AgenticWorkflowStep alternativeStep = step.withAlternativeTool(alternativeTool);
                executeWorkflowStep(alternativeStep, context);
                
                return true; // Success with alternative
                
            } catch (Exception altError) {
                logger.warn("Alternative tool failed: {}", alternativeTool, altError);
            }
        }
        
        // No alternatives worked
        return false;
    }
    
    private long calculateExponentialBackoff(int retryCount) {
        return Math.min(1000L * (1L << (retryCount - 1)), 30000L); // Max 30 seconds
    }
    
    private void handleWorkflowFailure(BaseJourneyEvent event, McpExecutionContext context, Exception error) {
        logger.error("Workflow failed for journey: {}", event.getJourneyId(), error);
        
        // Publish failure event for manual intervention
        WorkflowFailureEvent failureEvent = new WorkflowFailureEvent(
            event.getJourneyId(),
            event.getUserId(),
            context.agentId(),
            error.getMessage(),
            "MANUAL_INTERVENTION_REQUIRED",
            System.currentTimeMillis()
        );
        
        kafkaTemplate.send(AGENT_EVENTS_TOPIC, failureEvent);
    }
    
    private void publishStepCompletionEvent(String journeyId, AgenticWorkflowStep step, 
                                          boolean success, String errorMessage) {
        StepCompletionEvent event = new StepCompletionEvent(
            journeyId,
            step.stepName(),
            step.mcpToolName(),
            success,
            errorMessage,
            step.getExecutionTime(),
            System.currentTimeMillis()
        );
        
        kafkaTemplate.send(AGENT_EVENTS_TOPIC, event);
    }
    
    private void publishWorkflowCompletionEvent(String journeyId, AgenticWorkflowPlan plan, 
                                              boolean success, String errorMessage) {
        WorkflowCompletionEvent event = new WorkflowCompletionEvent(
            journeyId,
            plan.workflowType(),
            plan.steps().size(),
            success,
            errorMessage,
            plan.getTotalExecutionTime(),
            System.currentTimeMillis()
        );
        
        kafkaTemplate.send(AGENT_EVENTS_TOPIC, event);
    }
}

// Supporting classes and events
record AgenticWorkflowPlan(
    String workflowType,
    List<AgenticWorkflowStep> steps,
    Map<String, Object> globalContext
) {
    public long getTotalExecutionTime() {
        return steps.stream().mapToLong(AgenticWorkflowStep::getExecutionTime).sum();
    }
}

class AgenticWorkflowStep {
    private final String stepName;
    private final String mcpToolName;
    private final Map<String, Object> parameters;
    private final List<String> targetDomains;
    private final boolean recoverable;
    private final int maxRetries;
    private final List<String> alternativeTools;
    private final boolean requiresCoordination;
    private final Map<String, Object> coordinationMetadata;
    
    private Object result;
    private int retryCount = 0;
    private long executionTime = 0;
    
    public AgenticWorkflowStep(String stepName, String mcpToolName, Map<String, Object> parameters,
                              List<String> targetDomains, boolean recoverable, int maxRetries,
                              List<String> alternativeTools, boolean requiresCoordination,
                              Map<String, Object> coordinationMetadata) {
        this.stepName = stepName;
        this.mcpToolName = mcpToolName;
        this.parameters = parameters;
        this.targetDomains = targetDomains;
        this.recoverable = recoverable;
        this.maxRetries = maxRetries;
        this.alternativeTools = alternativeTools;
        this.requiresCoordination = requiresCoordination;
        this.coordinationMetadata = coordinationMetadata;
    }
    
    // Getters
    public String stepName() { return stepName; }
    public String mcpToolName() { return mcpToolName; }
    public Map<String, Object> parameters() { return parameters; }
    public List<String> targetDomains() { return targetDomains; }
    public boolean isRecoverable() { return recoverable; }
    public int getMaxRetries() { return maxRetries; }
    public List<String> getAlternativeTools() { return alternativeTools; }
    public boolean requiresCoordination() { return requiresCoordination; }
    public Map<String, Object> coordinationMetadata() { return coordinationMetadata; }
    
    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }
    public int getRetryCount() { return retryCount; }
    public int incrementRetryCount() { return ++retryCount; }
    public long getExecutionTime() { return executionTime; }
    public void setExecutionTime(long executionTime) { this.executionTime = executionTime; }
    
    public AgenticWorkflowStep withAlternativeTool(String alternativeTool) {
        return new AgenticWorkflowStep(
            stepName, alternativeTool, parameters, targetDomains,
            recoverable, maxRetries, alternativeTools, requiresCoordination, coordinationMetadata
        );
    }
}

class AgenticWorkflowException extends RuntimeException {
    public AgenticWorkflowException(String message) {
        super(message);
    }
    
    public AgenticWorkflowException(String message, Throwable cause) {
        super(message, cause);
    }
}

// Event records
record DomainCoordinationEvent(
    String traceId,
    String stepName,
    List<String> targetDomains,
    Object stepResult,
    Map<String, Object> coordinationMetadata,
    long timestamp
) {}

record StepCompletionEvent(
    String journeyId,
    String stepName,
    String mcpToolName,
    boolean success,
    String errorMessage,
    long executionTimeMs,
    long timestamp
) {}

record WorkflowCompletionEvent(
    String journeyId,
    String workflowType,
    int totalSteps,
    boolean success,
    String errorMessage,
    long totalExecutionTimeMs,
    long timestamp
) {}

record WorkflowFailureEvent(
    String journeyId,
    String userId,
    String agentId,
    String errorMessage,
    String requiredAction,
    long timestamp
) {}