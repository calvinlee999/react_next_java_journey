package com.fintech.journey.events;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Event when credit check is initiated for loan application
 */
public class CreditCheckInitiatedEvent extends BaseJourneyEvent {
    
    @JsonProperty("applicationId")
    private String applicationId;
    
    @JsonProperty("creditCheckRequest")
    private CreditCheckRequest creditCheckRequest;

    public CreditCheckInitiatedEvent() {
        super();
    }

    public CreditCheckInitiatedEvent(String journeyId, String userId, String applicationId, 
                                   CreditCheckRequest creditCheckRequest) {
        super(journeyId, userId, "credit.check.initiated", "journey-orchestrator");
        this.applicationId = applicationId;
        this.creditCheckRequest = creditCheckRequest;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public CreditCheckRequest getCreditCheckRequest() {
        return creditCheckRequest;
    }

    public void setCreditCheckRequest(CreditCheckRequest creditCheckRequest) {
        this.creditCheckRequest = creditCheckRequest;
    }

    /**
     * Supporting Data Class for Credit Check Request
     */
    public static class CreditCheckRequest {
        private String ssn;
        private String firstName;
        private String lastName;
        private String dateOfBirth;
        private BigDecimal requestedAmount;
        private String address;
        private String checkType;
        private String provider;
        
        // Default constructor for JSON deserialization
        public CreditCheckRequest() {
            // Empty constructor required for Jackson JSON deserialization
        }
        
        public CreditCheckRequest(String ssn, String firstName, String lastName, 
                                String dateOfBirth, BigDecimal requestedAmount, 
                                String address, String checkType, String provider) {
            this.ssn = ssn;
            this.firstName = firstName;
            this.lastName = lastName;
            this.dateOfBirth = dateOfBirth;
            this.requestedAmount = requestedAmount;
            this.address = address;
            this.checkType = checkType;
            this.provider = provider;
        }
        
        // Getters and Setters
        public String getSsn() { 
            return ssn; 
        }
        
        public void setSsn(String ssn) { 
            this.ssn = ssn; 
        }
        
        public String getFirstName() { 
            return firstName; 
        }
        
        public void setFirstName(String firstName) { 
            this.firstName = firstName; 
        }
        
        public String getLastName() { 
            return lastName; 
        }
        
        public void setLastName(String lastName) { 
            this.lastName = lastName; 
        }
        
        public String getDateOfBirth() { 
            return dateOfBirth; 
        }
        
        public void setDateOfBirth(String dateOfBirth) { 
            this.dateOfBirth = dateOfBirth; 
        }
        
        public BigDecimal getRequestedAmount() { 
            return requestedAmount; 
        }
        
        public void setRequestedAmount(BigDecimal requestedAmount) { 
            this.requestedAmount = requestedAmount; 
        }
        
        public String getAddress() { 
            return address; 
        }
        
        public void setAddress(String address) { 
            this.address = address; 
        }
        
        public String getCheckType() { 
            return checkType; 
        }
        
        public void setCheckType(String checkType) { 
            this.checkType = checkType; 
        }
        
        public String getProvider() { 
            return provider; 
        }
        
        public void setProvider(String provider) { 
            this.provider = provider; 
        }
    }
}