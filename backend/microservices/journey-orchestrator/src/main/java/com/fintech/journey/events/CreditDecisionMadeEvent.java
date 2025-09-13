package com.fintech.journey.events;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Event when credit decision is made for loan application
 */
public class CreditDecisionMadeEvent extends BaseJourneyEvent {
    
    @JsonProperty("applicationId")
    private String applicationId;
    
    @JsonProperty("creditDecision")
    private CreditDecision creditDecision;

    public CreditDecisionMadeEvent() {
        super();
    }

    public CreditDecisionMadeEvent(String journeyId, String userId, String applicationId, 
                                 CreditDecision creditDecision) {
        super(journeyId, userId, "credit.decision.made", "credit-service");
        this.applicationId = applicationId;
        this.creditDecision = creditDecision;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public CreditDecision getCreditDecision() {
        return creditDecision;
    }

    public void setCreditDecision(CreditDecision creditDecision) {
        this.creditDecision = creditDecision;
    }

    /**
     * Supporting Data Class for Credit Decision
     */
    public static class CreditDecision {
        private String decision; // APPROVED, DECLINED, CONDITIONAL
        private Integer creditScore;
        private BigDecimal approvedAmount;
        private BigDecimal interestRate;
        private String riskCategory;
        private String decisionReason;
        private Map<String, Object> conditions;
        private String reportId;
        private String provider;
        
        // Default constructor for JSON deserialization
        public CreditDecision() {
            // Empty constructor required for Jackson JSON deserialization
        }
        
        /**
         * Builder pattern constructor
         */
        public static CreditDecisionBuilder builder() {
            return new CreditDecisionBuilder();
        }
        
        public static class CreditDecisionBuilder {
            private String decision;
            private Integer creditScore;
            private BigDecimal approvedAmount;
            private BigDecimal interestRate;
            private String riskCategory;
            private String decisionReason;
            private Map<String, Object> conditions;
            private String reportId;
            private String provider;
            
            public CreditDecisionBuilder decision(String decision) {
                this.decision = decision;
                return this;
            }
            
            public CreditDecisionBuilder creditScore(Integer creditScore) {
                this.creditScore = creditScore;
                return this;
            }
            
            public CreditDecisionBuilder approvedAmount(BigDecimal approvedAmount) {
                this.approvedAmount = approvedAmount;
                return this;
            }
            
            public CreditDecisionBuilder interestRate(BigDecimal interestRate) {
                this.interestRate = interestRate;
                return this;
            }
            
            public CreditDecisionBuilder riskCategory(String riskCategory) {
                this.riskCategory = riskCategory;
                return this;
            }
            
            public CreditDecisionBuilder decisionReason(String decisionReason) {
                this.decisionReason = decisionReason;
                return this;
            }
            
            public CreditDecisionBuilder conditions(Map<String, Object> conditions) {
                this.conditions = conditions;
                return this;
            }
            
            public CreditDecisionBuilder reportId(String reportId) {
                this.reportId = reportId;
                return this;
            }
            
            public CreditDecisionBuilder provider(String provider) {
                this.provider = provider;
                return this;
            }
            
            public CreditDecision build() {
                CreditDecision creditDecision = new CreditDecision();
                creditDecision.decision = this.decision;
                creditDecision.creditScore = this.creditScore;
                creditDecision.approvedAmount = this.approvedAmount;
                creditDecision.interestRate = this.interestRate;
                creditDecision.riskCategory = this.riskCategory;
                creditDecision.decisionReason = this.decisionReason;
                creditDecision.conditions = this.conditions;
                creditDecision.reportId = this.reportId;
                creditDecision.provider = this.provider;
                return creditDecision;
            }
        }
        
        // Getters and Setters
        public String getDecision() { 
            return decision; 
        }
        
        public void setDecision(String decision) { 
            this.decision = decision; 
        }
        
        public Integer getCreditScore() { 
            return creditScore; 
        }
        
        public void setCreditScore(Integer creditScore) { 
            this.creditScore = creditScore; 
        }
        
        public BigDecimal getApprovedAmount() { 
            return approvedAmount; 
        }
        
        public void setApprovedAmount(BigDecimal approvedAmount) { 
            this.approvedAmount = approvedAmount; 
        }
        
        public BigDecimal getInterestRate() { 
            return interestRate; 
        }
        
        public void setInterestRate(BigDecimal interestRate) { 
            this.interestRate = interestRate; 
        }
        
        public String getRiskCategory() { 
            return riskCategory; 
        }
        
        public void setRiskCategory(String riskCategory) { 
            this.riskCategory = riskCategory; 
        }
        
        public String getDecisionReason() { 
            return decisionReason; 
        }
        
        public void setDecisionReason(String decisionReason) { 
            this.decisionReason = decisionReason; 
        }
        
        public Map<String, Object> getConditions() { 
            return conditions; 
        }
        
        public void setConditions(Map<String, Object> conditions) { 
            this.conditions = conditions; 
        }
        
        public String getReportId() { 
            return reportId; 
        }
        
        public void setReportId(String reportId) { 
            this.reportId = reportId; 
        }
        
        public String getProvider() { 
            return provider; 
        }
        
        public void setProvider(String provider) { 
            this.provider = provider; 
        }
    }
}