package com.fintech.journey.events;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Initial event when user starts loan application
 */
public class LoanApplicationSubmittedEvent extends BaseJourneyEvent {
    
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

    /**
     * Supporting Data Class for Loan Application
     */
    public static class LoanApplicationData {
        private BigDecimal requestedAmount;
        private String loanPurpose;
        private Integer termMonths;
        private String incomeSource;
        private BigDecimal monthlyIncome;
        private BigDecimal monthlyExpenses;
        
        // Default constructor for JSON deserialization
        public LoanApplicationData() {
            // Empty constructor required for Jackson JSON deserialization
        }
        
        // Getters and Setters
        public BigDecimal getRequestedAmount() { 
            return requestedAmount; 
        }
        
        public void setRequestedAmount(BigDecimal requestedAmount) { 
            this.requestedAmount = requestedAmount; 
        }
        
        public String getLoanPurpose() { 
            return loanPurpose; 
        }
        
        public void setLoanPurpose(String loanPurpose) { 
            this.loanPurpose = loanPurpose; 
        }
        
        public Integer getTermMonths() { 
            return termMonths; 
        }
        
        public void setTermMonths(Integer termMonths) { 
            this.termMonths = termMonths; 
        }
        
        public String getIncomeSource() { 
            return incomeSource; 
        }
        
        public void setIncomeSource(String incomeSource) { 
            this.incomeSource = incomeSource; 
        }
        
        public BigDecimal getMonthlyIncome() { 
            return monthlyIncome; 
        }
        
        public void setMonthlyIncome(BigDecimal monthlyIncome) { 
            this.monthlyIncome = monthlyIncome; 
        }
        
        public BigDecimal getMonthlyExpenses() { 
            return monthlyExpenses; 
        }
        
        public void setMonthlyExpenses(BigDecimal monthlyExpenses) { 
            this.monthlyExpenses = monthlyExpenses; 
        }
    }

    /**
     * Supporting Data Class for Applicant Profile
     */
    public static class ApplicantProfile {
        private String firstName;
        private String lastName;
        private String email;
        private String phoneNumber;
        private String ssn;
        private String dateOfBirth;
        private Address address;
        
        // Default constructor for JSON deserialization
        public ApplicantProfile() {
            // Empty constructor required for Jackson JSON deserialization
        }
        
        // Getters and Setters
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public String getSsn() { return ssn; }
        public void setSsn(String ssn) { this.ssn = ssn; }
        
        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        
        public Address getAddress() { return address; }
        public void setAddress(Address address) { this.address = address; }
    }

    /**
     * Supporting Data Class for Address
     */
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        
        // Default constructor for JSON deserialization
        public Address() {
            // Empty constructor required for Jackson JSON deserialization
        }
        
        // Getters and Setters
        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }
        
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        
        public String getZipCode() { return zipCode; }
        public void setZipCode(String zipCode) { this.zipCode = zipCode; }
        
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }
}