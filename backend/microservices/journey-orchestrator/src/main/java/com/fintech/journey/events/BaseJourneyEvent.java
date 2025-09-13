package com.fintech.journey.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Base Event for User Journey
 * All journey events extend from this base class
 */
public abstract class BaseJourneyEvent {
    
    @JsonProperty("eventId")
    private String eventId;
    
    @JsonProperty("journeyId")
    private String journeyId;
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("eventType")
    private String eventType;
    
    @JsonProperty("eventTimestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime eventTimestamp;
    
    @JsonProperty("correlationId")
    private String correlationId;
    
    @JsonProperty("sessionId")
    private String sessionId;
    
    @JsonProperty("source")
    private String source;
    
    @JsonProperty("version")
    private String version;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    // Constructors
    protected BaseJourneyEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventTimestamp = LocalDateTime.now();
        this.version = "1.0";
    }

    protected BaseJourneyEvent(String journeyId, String userId, String eventType, String source) {
        this();
        this.journeyId = journeyId;
        this.userId = userId;
        this.eventType = eventType;
        this.source = source;
    }

    // Getters and Setters
    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getJourneyId() {
        return journeyId;
    }

    public void setJourneyId(String journeyId) {
        this.journeyId = journeyId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    public void setEventTimestamp(LocalDateTime eventTimestamp) {
        this.eventTimestamp = eventTimestamp;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    @Override
    public String toString() {
        return "BaseJourneyEvent{" +
                "eventId='" + eventId + '\'' +
                ", journeyId='" + journeyId + '\'' +
                ", userId='" + userId + '\'' +
                ", eventType='" + eventType + '\'' +
                ", eventTimestamp=" + eventTimestamp +
                ", source='" + source + '\'' +
                '}';
    }
}

/**
 * Loan Application Journey Events
 */

/**
 * Initial event when user starts loan application
 */
class LoanApplicationSubmittedEvent extends BaseJourneyEvent {
    
    @JsonProperty("applicationData")
    private LoanApplicationData applicationData;
    
    @JsonProperty("applicantProfile")
    private ApplicantProfile applicantProfile;

    public LoanApplicationSubmittedEvent() {
        super();
    }

    public LoanApplicationSubmittedEvent(String journeyId, String userId, 
                                       LoanApplicationData applicationData, 
                                       ApplicantProfile applicantProfile) {
        super(journeyId, userId, "loan.application.submitted", "frontend");
        this.applicationData = applicationData;
        this.applicantProfile = applicantProfile;
    }

    public LoanApplicationData getApplicationData() {
        return applicationData;
    }

    public void setApplicationData(LoanApplicationData applicationData) {
        this.applicationData = applicationData;
    }

    public ApplicantProfile getApplicantProfile() {
        return applicantProfile;
    }

    public void setApplicantProfile(ApplicantProfile applicantProfile) {
        this.applicantProfile = applicantProfile;
    }
}

/**
 * Event when credit check process begins
 */
class CreditCheckInitiatedEvent extends BaseJourneyEvent {
    
    @JsonProperty("creditBureau")
    private String creditBureau;
    
    @JsonProperty("requestedScore")
    private String requestedScore;
    
    @JsonProperty("checkType")
    private String checkType;

    public CreditCheckInitiatedEvent() {
        super();
    }

    public CreditCheckInitiatedEvent(String journeyId, String userId, String creditBureau, String checkType) {
        super(journeyId, userId, "credit.check.initiated", "credit-service");
        this.creditBureau = creditBureau;
        this.checkType = checkType;
    }

    public String getCreditBureau() {
        return creditBureau;
    }

    public void setCreditBureau(String creditBureau) {
        this.creditBureau = creditBureau;
    }

    public String getRequestedScore() {
        return requestedScore;
    }

    public void setRequestedScore(String requestedScore) {
        this.requestedScore = requestedScore;
    }

    public String getCheckType() {
        return checkType;
    }

    public void setCheckType(String checkType) {
        this.checkType = checkType;
    }
}

/**
 * Event when credit decision is made
 */
class CreditDecisionMadeEvent extends BaseJourneyEvent {
    
    @JsonProperty("decision")
    private String decision; // APPROVED, DENIED, CONDITIONAL
    
    @JsonProperty("creditScore")
    private Integer creditScore;
    
    @JsonProperty("approvedAmount")
    private BigDecimal approvedAmount;
    
    @JsonProperty("interestRate")
    private BigDecimal interestRate;
    
    @JsonProperty("conditions")
    private String[] conditions;
    
    @JsonProperty("decisionReason")
    private String decisionReason;

    public CreditDecisionMadeEvent() {
        super();
    }

    public CreditDecisionMadeEvent(String journeyId, String userId, String decision, 
                                 Integer creditScore, BigDecimal approvedAmount) {
        super(journeyId, userId, "credit.decision.made", "credit-service");
        this.decision = decision;
        this.creditScore = creditScore;
        this.approvedAmount = approvedAmount;
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

    public String[] getConditions() {
        return conditions;
    }

    public void setConditions(String[] conditions) {
        this.conditions = conditions;
    }

    public String getDecisionReason() {
        return decisionReason;
    }

    public void setDecisionReason(String decisionReason) {
        this.decisionReason = decisionReason;
    }
}

/**
 * Event when contract is generated
 */
class ContractGeneratedEvent extends BaseJourneyEvent {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("contractType")
    private String contractType;
    
    @JsonProperty("loanTerms")
    private LoanTerms loanTerms;
    
    @JsonProperty("documentUrl")
    private String documentUrl;
    
    @JsonProperty("expiresAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime expiresAt;

    public ContractGeneratedEvent() {
        super();
    }

    public ContractGeneratedEvent(String journeyId, String userId, String contractId, 
                                LoanTerms loanTerms, String documentUrl) {
        super(journeyId, userId, "contract.generated", "contract-service");
        this.contractId = contractId;
        this.loanTerms = loanTerms;
        this.documentUrl = documentUrl;
        this.expiresAt = LocalDateTime.now().plusDays(7); // 7 days to sign
    }

    // Getters and Setters
    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

    public LoanTerms getLoanTerms() {
        return loanTerms;
    }

    public void setLoanTerms(LoanTerms loanTerms) {
        this.loanTerms = loanTerms;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}

/**
 * Event when contract is signed
 */
class ContractSignedEvent extends BaseJourneyEvent {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("signatureMethod")
    private String signatureMethod; // DIGITAL, ELECTRONIC, WET_SIGNATURE
    
    @JsonProperty("signedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime signedAt;
    
    @JsonProperty("signedDocumentUrl")
    private String signedDocumentUrl;
    
    @JsonProperty("witnessDetails")
    private WitnessDetails witnessDetails;

    public ContractSignedEvent() {
        super();
    }

    public ContractSignedEvent(String journeyId, String userId, String contractId, 
                             String signatureMethod, String signedDocumentUrl) {
        super(journeyId, userId, "contract.signed", "contract-service");
        this.contractId = contractId;
        this.signatureMethod = signatureMethod;
        this.signedDocumentUrl = signedDocumentUrl;
        this.signedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getSignatureMethod() {
        return signatureMethod;
    }

    public void setSignatureMethod(String signatureMethod) {
        this.signatureMethod = signatureMethod;
    }

    public LocalDateTime getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(LocalDateTime signedAt) {
        this.signedAt = signedAt;
    }

    public String getSignedDocumentUrl() {
        return signedDocumentUrl;
    }

    public void setSignedDocumentUrl(String signedDocumentUrl) {
        this.signedDocumentUrl = signedDocumentUrl;
    }

    public WitnessDetails getWitnessDetails() {
        return witnessDetails;
    }

    public void setWitnessDetails(WitnessDetails witnessDetails) {
        this.witnessDetails = witnessDetails;
    }
}

/**
 * Event when funds are disbursed
 */
class FundsDisbursedEvent extends BaseJourneyEvent {
    
    @JsonProperty("disbursementId")
    private String disbursementId;
    
    @JsonProperty("amount")
    private BigDecimal amount;
    
    @JsonProperty("bankAccount")
    private BankAccountDetails bankAccount;
    
    @JsonProperty("disbursementMethod")
    private String disbursementMethod; // ACH, WIRE, CHECK
    
    @JsonProperty("expectedArrival")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime expectedArrival;

    public FundsDisbursedEvent() {
        super();
    }

    public FundsDisbursedEvent(String journeyId, String userId, String disbursementId, 
                             BigDecimal amount, BankAccountDetails bankAccount) {
        super(journeyId, userId, "funds.disbursed", "payment-service");
        this.disbursementId = disbursementId;
        this.amount = amount;
        this.bankAccount = bankAccount;
    }

    // Getters and Setters
    public String getDisbursementId() {
        return disbursementId;
    }

    public void setDisbursementId(String disbursementId) {
        this.disbursementId = disbursementId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BankAccountDetails getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(BankAccountDetails bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getDisbursementMethod() {
        return disbursementMethod;
    }

    public void setDisbursementMethod(String disbursementMethod) {
        this.disbursementMethod = disbursementMethod;
    }

    public LocalDateTime getExpectedArrival() {
        return expectedArrival;
    }

    public void setExpectedArrival(LocalDateTime expectedArrival) {
        this.expectedArrival = expectedArrival;
    }
}

/**
 * Supporting Data Classes
 */
class LoanApplicationData {
    private BigDecimal requestedAmount;
    private String loanPurpose;
    private Integer termMonths;
    private String incomeSource;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    
    // Constructors, getters, setters
    public LoanApplicationData() {}
    
    // Getters and Setters
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal requestedAmount) { this.requestedAmount = requestedAmount; }
    
    public String getLoanPurpose() { return loanPurpose; }
    public void setLoanPurpose(String loanPurpose) { this.loanPurpose = loanPurpose; }
    
    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }
    
    public String getIncomeSource() { return incomeSource; }
    public void setIncomeSource(String incomeSource) { this.incomeSource = incomeSource; }
    
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
    
    public BigDecimal getMonthlyExpenses() { return monthlyExpenses; }
    public void setMonthlyExpenses(BigDecimal monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }
}

class ApplicantProfile {
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String ssn;
    private LocalDateTime dateOfBirth;
    private Address address;
    
    // Constructors, getters, setters
    public ApplicantProfile() {}
    
    // Getters and Setters omitted for brevity
}

class Address {
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    
    // Constructors, getters, setters
    public Address() {}
}

class LoanTerms {
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private BigDecimal monthlyPayment;
    private BigDecimal totalInterest;
    private String paymentSchedule;
    
    // Constructors, getters, setters
    public LoanTerms() {}
}

class WitnessDetails {
    private String witnessName;
    private String witnessEmail;
    private String witnessType;
    private LocalDateTime witnessedAt;
    
    // Constructors, getters, setters
    public WitnessDetails() {}
}

class BankAccountDetails {
    private String accountNumber;
    private String routingNumber;
    private String bankName;
    private String accountType;
    
    // Constructors, getters, setters (with appropriate masking for security)
    public BankAccountDetails() {}
}