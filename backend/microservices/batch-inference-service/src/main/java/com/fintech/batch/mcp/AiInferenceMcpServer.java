package com.fintech.batch.mcp;

import com.fintech.mcp.core.McpServer;
import com.fintech.mcp.core.McpToolDefinition;
import com.fintech.mcp.core.McpParameter;
import com.fintech.batch.model.InferenceRequest;
import com.fintech.batch.model.InferenceResult;
import com.fintech.batch.service.BatchInferenceService;
import com.fintech.batch.service.StreamingInferenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import java.util.UUID;

/**
 * AI Inference MCP Server
 * 
 * Exposes AI inference capabilities as MCP tools for fraud detection,
 * credit scoring, and risk assessment. Supports real-time, near-real-time,
 * and batch inference modes as defined in the platform architecture.
 */
@Service
@McpServer(
    name = "ai-inference-server",
    description = "AI-powered fraud detection, credit scoring, and risk assessment for agents",
    domain = "ai-inference",
    version = "1.0.0"
)
public class AiInferenceMcpServer {
    
    private static final Logger logger = LoggerFactory.getLogger(AiInferenceMcpServer.class);
    
    private final BatchInferenceService batchInferenceService;
    private final StreamingInferenceService streamingInferenceService;
    
    public AiInferenceMcpServer(
            BatchInferenceService batchInferenceService,
            StreamingInferenceService streamingInferenceService) {
        this.batchInferenceService = batchInferenceService;
        this.streamingInferenceService = streamingInferenceService;
    }
    
    /**
     * Real-time fraud detection (< 100ms)
     * Business capability: Real-time transaction fraud scoring
     */
    @McpToolDefinition(
        name = "detect_transaction_fraud",
        description = "Performs real-time fraud detection on financial transactions. Returns fraud score and risk indicators within 100ms for payment authorization.",
        domain = "ai-inference",
        tags = {"fraud", "real-time", "transaction", "risk"},
        isReadOnly = true,
        timeoutMs = 5000
    )
    public FraudDetectionResult detectTransactionFraud(
            @McpParameter(
                description = "Transaction amount in USD",
                required = true
            ) String transactionAmount,
            
            @McpParameter(
                description = "Merchant category code",
                required = true
            ) String merchantCategory,
            
            @McpParameter(
                description = "User identifier",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "Transaction location (city, country)",
                required = true
            ) String location,
            
            @McpParameter(
                description = "Payment method (CARD, ACH, WIRE)",
                required = true
            ) String paymentMethod,
            
            @McpParameter(
                description = "Hour of day (0-23)",
                required = true
            ) Integer hourOfDay) {
        
        logger.info("Performing real-time fraud detection for user: {} via MCP", userId);
        
        try {
            // Create inference request
            InferenceRequest request = InferenceRequest.builder()
                .modelName("fraud-detection-realtime")
                .features(Map.of(
                    "transaction_amount", new BigDecimal(transactionAmount),
                    "merchant_category", merchantCategory,
                    "user_id", userId,
                    "location", location,
                    "payment_method", paymentMethod,
                    "hour_of_day", hourOfDay
                ))
                .requestId(UUID.randomUUID().toString())
                .build();
            
            // Perform real-time inference
            InferenceResult result = streamingInferenceService.performRealTimeInference(request);
            
            // Extract fraud score and risk indicators
            BigDecimal fraudScore = (BigDecimal) result.getPredictions().get("fraud_score");
            String riskLevel = fraudScore.compareTo(BigDecimal.valueOf(0.7)) > 0 ? "HIGH" :
                             fraudScore.compareTo(BigDecimal.valueOf(0.3)) > 0 ? "MEDIUM" : "LOW";
            
            @SuppressWarnings("unchecked")
            List<String> riskFactors = (List<String>) result.getPredictions().getOrDefault("risk_factors", List.of());
            
            return new FraudDetectionResult(
                true,
                request.getRequestId(),
                userId,
                fraudScore.doubleValue(),
                riskLevel,
                riskFactors,
                fraudScore.compareTo(BigDecimal.valueOf(0.5)) > 0 ? "BLOCK" : "ALLOW",
                result.getExecutionTimeMs(),
                "Fraud detection completed successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to perform fraud detection via MCP", e);
            return new FraudDetectionResult(
                false,
                UUID.randomUUID().toString(),
                userId,
                0.0,
                "ERROR",
                List.of("SYSTEM_ERROR"),
                "MANUAL_REVIEW",
                0L,
                "Fraud detection failed: " + e.getMessage()
            );
        }
    }
    
    /**
     * Credit scoring assessment (1-10 seconds)
     * Business capability: Near-real-time credit risk evaluation
     */
    @McpToolDefinition(
        name = "assess_credit_risk",
        description = "Performs comprehensive credit risk assessment using ML models. Returns credit score, risk factors, and lending recommendations.",
        domain = "ai-inference",
        tags = {"credit", "risk", "scoring", "lending"},
        isReadOnly = true,
        timeoutMs = 15000
    )
    public CreditRiskResult assessCreditRisk(
            @McpParameter(
                description = "User identifier for credit assessment",
                required = true
            ) String userId,
            
            @McpParameter(
                description = "Requested loan amount",
                required = true
            ) String loanAmount,
            
            @McpParameter(
                description = "Annual income",
                required = true
            ) String annualIncome,
            
            @McpParameter(
                description = "Current debt obligations",
                required = true
            ) String currentDebt,
            
            @McpParameter(
                description = "Employment length in months",
                required = true
            ) Integer employmentLength,
            
            @McpParameter(
                description = "Credit bureau score (if available)",
                required = false
            ) Integer existingCreditScore) {
        
        logger.info("Performing credit risk assessment for user: {} via MCP", userId);
        
        try {
            // Create inference request
            InferenceRequest request = InferenceRequest.builder()
                .modelName("credit-scoring-v2")
                .features(Map.of(
                    "user_id", userId,
                    "loan_amount", new BigDecimal(loanAmount),
                    "annual_income", new BigDecimal(annualIncome),
                    "current_debt", new BigDecimal(currentDebt),
                    "employment_length", employmentLength,
                    "existing_credit_score", existingCreditScore != null ? existingCreditScore : 0
                ))
                .requestId(UUID.randomUUID().toString())
                .build();
            
            // Perform credit scoring
            InferenceResult result = streamingInferenceService.performNearRealTimeInference(request);
            
            // Extract credit assessment results
            BigDecimal creditScore = (BigDecimal) result.getPredictions().get("credit_score");
            BigDecimal defaultProbability = (BigDecimal) result.getPredictions().get("default_probability");
            String recommendedAction = (String) result.getPredictions().get("recommended_action");
            @SuppressWarnings("unchecked")
            List<String> riskFactors = (List<String>) result.getPredictions().getOrDefault("risk_factors", List.of());
            
            // Calculate debt-to-income ratio
            BigDecimal dtiRatio = new BigDecimal(currentDebt)
                .divide(new BigDecimal(annualIncome), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            
            return new CreditRiskResult(
                true,
                request.getRequestId(),
                userId,
                creditScore.intValue(),
                defaultProbability.doubleValue(),
                dtiRatio.doubleValue(),
                recommendedAction,
                riskFactors,
                result.getExecutionTimeMs(),
                "Credit risk assessment completed successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to perform credit risk assessment via MCP", e);
            return new CreditRiskResult(
                false,
                UUID.randomUUID().toString(),
                userId,
                0,
                1.0,
                0.0,
                "MANUAL_REVIEW",
                List.of("ASSESSMENT_ERROR"),
                0L,
                "Credit assessment failed: " + e.getMessage()
            );
        }
    }
    
    /**
     * Batch risk analysis for portfolio management
     * Business capability: Large-scale risk assessment and reporting
     */
    @McpToolDefinition(
        name = "analyze_portfolio_risk",
        description = "Performs batch risk analysis on loan portfolio or customer segments. Returns aggregated risk metrics and insights for decision making.",
        domain = "ai-inference",
        tags = {"portfolio", "risk", "batch", "analytics"},
        isReadOnly = true,
        timeoutMs = 60000
    )
    public PortfolioRiskResult analyzePortfolioRisk(
            @McpParameter(
                description = "Portfolio identifier or customer segment",
                required = true
            ) String portfolioId,
            
            @McpParameter(
                description = "Analysis type (PORTFOLIO_RISK, SEGMENT_ANALYSIS, STRESS_TEST)",
                required = true
            ) String analysisType,
            
            @McpParameter(
                description = "Risk model version to use",
                required = false
            ) String modelVersion,
            
            @McpParameter(
                description = "Analysis parameters (JSON string)",
                required = false
            ) String parameters) {
        
        logger.info("Performing portfolio risk analysis for: {} via MCP", portfolioId);
        
        try {
            // Create batch inference request
            InferenceRequest request = InferenceRequest.builder()
                .modelName("portfolio-risk-" + (modelVersion != null ? modelVersion : "v1"))
                .features(Map.of(
                    "portfolio_id", portfolioId,
                    "analysis_type", analysisType,
                    "parameters", parameters != null ? parameters : "{}"
                ))
                .requestId(UUID.randomUUID().toString())
                .build();
            
            // Submit batch job
            String jobId = batchInferenceService.submitBatchJob(request);
            
            // For MCP, we'll return the job ID and initial status
            // In a real implementation, you might want to poll for results
            
            return new PortfolioRiskResult(
                true,
                request.getRequestId(),
                jobId,
                portfolioId,
                analysisType,
                "SUBMITTED",
                0.0, // Overall risk score - would be calculated when job completes
                Map.of("job_status", "SUBMITTED", "estimated_completion", "5-10 minutes"),
                0L,
                "Portfolio risk analysis job submitted successfully"
            );
            
        } catch (Exception e) {
            logger.error("Failed to start portfolio risk analysis via MCP", e);
            return new PortfolioRiskResult(
                false,
                UUID.randomUUID().toString(),
                null,
                portfolioId,
                analysisType,
                "FAILED",
                0.0,
                Map.of("error", e.getMessage()),
                0L,
                "Portfolio analysis failed: " + e.getMessage()
            );
        }
    }
}

// Result DTOs for MCP responses
record FraudDetectionResult(
    boolean success,
    String requestId,
    String userId,
    double fraudScore,
    String riskLevel,
    List<String> riskFactors,
    String recommendation,
    long executionTimeMs,
    String message
) {}

record CreditRiskResult(
    boolean success,
    String requestId,
    String userId,
    int creditScore,
    double defaultProbability,
    double debtToIncomeRatio,
    String recommendedAction,
    List<String> riskFactors,
    long executionTimeMs,
    String message
) {}

record PortfolioRiskResult(
    boolean success,
    String requestId,
    String jobId,
    String portfolioId,
    String analysisType,
    String status,
    double overallRiskScore,
    Map<String, Object> analyticsResults,
    long executionTimeMs,
    String message
) {}