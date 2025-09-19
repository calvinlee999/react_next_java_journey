# Cross-Border Payment Level 0 - Enhanced Sequence Diagram
## UETR Lifecycle with 5 Stages, 13 Steps, MT/MX Message Mapping
## Enhanced for PMPG Use-Case 1a: Account to Account Remittances with Complete UETR State Management

```mermaid
sequenceDiagram
    participant Debtor as Debtor<br/>(Initiating Party)
    participant MobileApp as Mobile/Web App
    participant CorpPortal as Corporate Portal<br/>(Originator System)
    participant APIGateway as API Gateway
    participant PaymentInitSvc as Payment Initiation Service
    participant FXGateway as FX Gateway
    participant PaymentDB as Payment DB/Kafka Ingestion
    participant ApprovalEngine as Approval Engine<br/>(Maker-Checker)
    participant ComplianceEngine as Compliance Engine<br/>(AML/OFAC)
    participant PaymentSystem as Payment System<br/>(UETR Management)
    participant DebtorAgent as Debtor Agent<br/>(Sender Bank)
    participant SWIFTGateway as SWIFT Gateway<br/>(Instructing Agent)
    participant SWIFTNetwork as SWIFT Network<br/>gpi Tracker
    participant IntermediaryAgent as Intermediary Agent<br/>(Routing Bank)
    participant CreditAgent as Creditor Agent<br/>(Receiving Bank)
    participant UltimateCreditor as Ultimate Creditor<br/>(Final Beneficiary)
    participant gpiIntegration as gpi Integration<br/>(Status Tracking)
    participant NotificationSvc as Notification Service

    Note over Debtor, NotificationSvc: 🏛️ Enhanced UETR Lifecycle with Complete MT/MX Message Mapping

    rect rgb(240, 248, 255)
        Note over Debtor, PaymentDB: 📋 STAGE 1: PAYMENT INITIATION (Steps 1.1-1.3)
        
        Note over Debtor: 🔄 UETR State: Created/Pending Submission
        Debtor->>+MobileApp: 1.1 Initiate payment request
        Note right of Debtor: • GP2P remittance with structured party data<br/>• DOB, POB, structured addresses<br/>• gpi Role: Originator System
        
        MobileApp->>+CorpPortal: Submit payment instruction
        Note over CorpPortal: � Message: pain.001 (v9)<br/>🔑 Generate UETR (UUID v4-128 bits)<br/>💾 Not yet validated or formatted
        
        CorpPortal->>+APIGateway: Payment via API with UETR
        APIGateway->>+PaymentInitSvc: Create Payment Request
        
        Note over PaymentInitSvc: 🔄 UETR State: Validated/Authorized
        PaymentInitSvc->>+FXGateway: 1.2 Internal validations (AML, OFAC, limit checks)
        Note over FXGateway: • Account coverage validation<br/>• FX rate calculation<br/>• Duplicate prevention<br/>• gpi Role: Client/Originator
        FXGateway-->>-PaymentInitSvc: Validation results + approvals
        
        Note over PaymentSystem: 🔄 UETR State: Registered/Staged
        PaymentInitSvc->>+PaymentSystem: 1.3 Stage message with UETR
        Note over PaymentSystem: 📄 Messages: MT101/:50a, :52a<br/>💾 Message staged but not sent to SWIFT<br/>🔑 gpi Role: Initiating Bank
        PaymentSystem->>+PaymentDB: Persist with immutable UETR audit trail
        PaymentDB-->>-PaymentSystem: Persistence confirmation
        PaymentSystem-->>-PaymentInitSvc: Staging confirmation
        
        PaymentInitSvc-->>Debtor: 💰 Display transparent fees & FX rates
        Note over Debtor: 🎯 Target Benefit: Transparency & UETR tracking
    end

    rect rgb(248, 255, 248)
        Note over ApprovalEngine, DebtorAgent: 📋 STAGE 2: PAYMENT APPROVAL (Step 2.1-2.2)
        
        Note over DebtorAgent: 🔄 UETR State: Ready for Release
        PaymentInitSvc->>+ApprovalEngine: 2.1 Payment message formatted & queued for gateway
        Note over ApprovalEngine: • Dual approval workflow (Maker-Checker)<br/>• gpi Role: Sender
        ApprovalEngine->>+ComplianceEngine: Enhanced AML/OFAC screening
        Note over ComplianceEngine: 🛡️ P2P-specific fraud screening<br/>🔍 Enhanced party validation
        ComplianceEngine-->>-ApprovalEngine: Compliance clearance
        
        ApprovalEngine->>+DebtorAgent: Queue for SWIFT transmission
        Note over DebtorAgent: 📄 Messages: MT103/:52a, pacs.008<br/>🔑 gpi Role: Sender
        
        alt ❌ Validation Failed - Rejected before SWIFT
            Note over DebtorAgent: 🔄 UETR State: Rejected (Pre-SWIFT)
            DebtorAgent-->>ApprovalEngine: 2.2 Validation failed - rejection
            Note over DebtorAgent: 📄 Messages: MT199/:72 (optional notes)<br/>🔑 gpi Role: Rejector
            ApprovalEngine-->>Debtor: 🚫 Pre-SWIFT rejection notice
        else ✅ Payment Approved for Release
            DebtorAgent-->>-ApprovalEngine: Ready for SWIFT transmission
        end
    end

    alt ✅ Payment Released to SWIFT
        rect rgb(255, 248, 240)
            Note over SWIFTGateway, SWIFTNetwork: 📋 STAGE 3: PAYMENT GATEWAY (Step 3.1-3.2)
            
            Note over SWIFTGateway: 🔄 UETR State: Released/Sent
            ApprovalEngine->>+SWIFTGateway: 3.1 Message released to SWIFT
            Note over SWIFTGateway: • UETR enters gpi Tracker<br/>• gpi Role: Sender
            SWIFTGateway->>+SWIFTNetwork: Send formatted message
            Note over SWIFTNetwork: 📄 Messages: MT103/:53a, :54a, :55a<br/>🔑 UETR propagation begins
            SWIFTNetwork-->>-SWIFTGateway: SWIFT transmission ACK
            SWIFTGateway-->>-ApprovalEngine: Gateway confirmation
            
            Note over IntermediaryAgent: 🔄 UETR State: Intermediary Processing
            SWIFTNetwork->>+IntermediaryAgent: 3.2 Route to intermediary/correspondent
            Note over IntermediaryAgent: 📄 Messages: MT103/:56a<br/>🔑 gpi Role: Intermediary Agent
            IntermediaryAgent-->>-SWIFTNetwork: Intermediary ACK
        end

        rect rgb(255, 240, 255)
            Note over SWIFTNetwork, gpiIntegration: 📋 STAGE 4: PAYMENT PROCESSOR (Steps 4.1-4.4)
            
            Note over IntermediaryAgent: 🔄 UETR State: In Transit
            SWIFTNetwork->>+IntermediaryAgent: 4.1 Payment routed across intermediary/correspondent banks
            Note over IntermediaryAgent: • Multi-hop routing via correspondent banks<br/>• UETR propagates via MT/MX messages<br/>• gpi Role: Routing Bank
            
            Note over IntermediaryAgent: 🔄 UETR State: Settled at Intermediary
            IntermediaryAgent->>IntermediaryAgent: 4.2 Intermediary received & forwarded payment
            Note over IntermediaryAgent: 📄 Messages: MT103<br/>🔑 gpi Role: Settling Agent
            
            alt ❌ Payment Rejected After Being Sent
                Note over IntermediaryAgent: 🔄 UETR State: Rejected (After Sent)
                IntermediaryAgent-->>SWIFTNetwork: 4.3 Payment rejected after SWIFT transmission
                Note over IntermediaryAgent: 📄 Messages: MT199/:72 or MT299<br/>🔑 Account closure, compliance issues<br/>🔑 gpi Role: Rejector
                SWIFTNetwork-->>gpiIntegration: Rejection status update
            else ❌ Payment Returned After Settlement
                Note over CreditAgent: 🔄 UETR State: Returned (After Settlement)
                CreditAgent-->>IntermediaryAgent: 4.4 Payment initially accepted but returned
                Note over CreditAgent: 📄 Messages: MT202 Return<br/>🔑 Wrong account, beneficiary issues<br/>🔑 gpi Role: Return Sender
                IntermediaryAgent-->>SWIFTNetwork: Return processing
            else ✅ Payment Successfully Forwarded
                IntermediaryAgent->>+CreditAgent: Forward to receiving bank
                CreditAgent-->>-IntermediaryAgent: Receipt confirmation
            end
            
            SWIFTNetwork->>+gpiIntegration: Real-time gpi status tracking
            Note over gpiIntegration: 🔍 get_payment_status API every 4 hours<br/>� Real-time status updates via gpi Tracker
            gpiIntegration-->>-SWIFTNetwork: Status tracking active
        end

        rect rgb(240, 255, 240)
            Note over CreditAgent, UltimateCreditor: 📋 STAGE 5: PAYMENT INTEGRATION (Steps 5.1-5.3)
            
            Note over CreditAgent: 🔄 UETR State: Received by Creditor Bank
            CreditAgent->>+CreditAgent: 5.1 Final receiving institution acknowledges payment
            Note over CreditAgent: 📄 Messages: MT103/:57a<br/>🔑 gpi Role: Receiving Bank
            
            Note over CreditAgent: 🔄 UETR State: Confirmed/Settled
            CreditAgent->>CreditAgent: 5.2 Payment confirmed settled, final credit done
            Note over CreditAgent: 📄 Messages: MT910, camt.054<br/>🔑 gpi Role: Receiver
            
            Note over UltimateCreditor: 🔄 UETR State: Credited to Beneficiary
            CreditAgent->>+UltimateCreditor: 5.3 Funds posted to end beneficiary
            Note over UltimateCreditor: • Final credit to beneficiary account<br/>• gpi Role: Final Beneficiary
            UltimateCreditor-->>-CreditAgent: Credit confirmation
            
            CreditAgent->>+gpiIntegration: Final status update to gpi Tracker
            gpiIntegration->>+NotificationSvc: Trigger completion notifications
            NotificationSvc-->>Debtor: 📱 Payment completion alert with UETR
            Note over Debtor: 🎯 Target Benefits: Completion Alert & Traceability
            NotificationSvc-->>-gpiIntegration: Notification sent
            gpiIntegration-->>-CreditAgent: Status update complete
        end
    end

    Note over Debtor, UltimateCreditor: 🎯 ENHANCED TARGET BENEFITS WITH UETR LIFECYCLE
    Note over Debtor: ✅ Transparency: Real-time UETR state transitions
    Note over SWIFTNetwork: ✅ Traceability: Complete UETR journey mapping
    Note over NotificationSvc: ✅ Completion Alert: State-based notifications
    Note over DebtorAgent: ✅ Payment Accuracy: Enhanced MT/MX message mapping
    Note over UltimateCreditor: ✅ Sender Clarity: Structured party identification
    Note over gpiIntegration: ✅ Reduced Investigations: Complete UETR audit trail
    Note over ComplianceEngine: ✅ Fraud Screening: Pre and post-SWIFT validation
    Note over CreditAgent: ✅ Product Effectiveness: End-to-end status visibility

    rect rgb(248, 255, 248)
        Note over WorkflowEngine, AuditService: 📋 STAGE 2: PAYMENT APPROVAL (Silver Layer)
        
        PaymentInitSvc->>+WorkflowEngine: 4. Dual approval workflow (Maker-Checker)
        Note over WorkflowEngine: 🔄 Role-based approval logic, rejection comments
        WorkflowEngine->>WorkflowEngine: Human/automated approval decision
        
        WorkflowEngine->>+ComplianceEngine: 5. AML/OFAC screening
        Note over ComplianceEngine: 🛡️ Transaction risk scoring, sanction list checks
        ComplianceEngine->>ComplianceEngine: Enhanced P2P fraud screening
        ComplianceEngine-->>-WorkflowEngine: Compliance result
        Note over ComplianceEngine: 🎯 Target Benefit: Improved fraud screening
        
        WorkflowEngine->>+AuditService: 6. Status change & audit logging
        Note over AuditService: 📝 Approver ID, timestamp, digital signature
        AuditService-->>-WorkflowEngine: Audit logged
        
        WorkflowEngine-->>-PaymentInitSvc: Approval/rejection result
    end

    alt ✅ Payment Approved
        rect rgb(255, 248, 240)
            Note over PaymentFormatter, SWIFTNetwork: 📋 STAGE 3: PAYMENT GATEWAY (Silver Layer)
            
            PaymentInitSvc->>+PaymentFormatter: 7. Format message for legacy or ISO 20022
            Note over PaymentFormatter: 🔄 MT-MX mapping logic, schema validation (GP2P)
            PaymentFormatter->>PaymentFormatter: Convert to pacs.008 with structured party data
            
            PaymentFormatter->>+SWIFTGateway: 8. Send payment to SWIFT Network
            Note over SWIFTGateway: 🔐 Encryption, non-repudiation, confirmation receipt
            SWIFTGateway->>+SWIFTNetwork: Send pacs.008/MT103 with UETR
            Note over SWIFTNetwork: 📡 ISO 20022 message with GP2P category
            SWIFTNetwork-->>-SWIFTGateway: Transmission confirmation
            SWIFTGateway-->>-PaymentFormatter: SWIFT ACK received
            PaymentFormatter-->>-PaymentInitSvc: Gateway confirmation
        end

        rect rgb(255, 240, 255)
            Note over SWIFTNetwork, BatchScheduler: 📋 STAGE 4: ROUTING & EXECUTION (N/A → Gold)
            
            Note over SWIFTNetwork: 9. Routing via correspondent banks
            SWIFTNetwork->>SWIFTNetwork: UETR propagates via MT/MX messages
            Note over SWIFTNetwork: 🔗 Each hop updates status via gpi Tracker
            Note over SWIFTNetwork: 🎯 Target Benefit: Traceability & Payment accuracy
            
            SWIFTNetwork->>+gpiIntegration: 10. Retrieve real-time status via gpi API
            Note over gpiIntegration: 🔍 get_payment_status API every 4 hours
            gpiIntegration-->>-SWIFTNetwork: gpi status update
            
            gpiIntegration->>+BatchScheduler: 11. Retry logic if no update from gpi in 4 hours
            Note over BatchScheduler: ⏰ get_payment_status, track_payment API calls
            BatchScheduler->>BatchScheduler: Conditional trigger for gpi call
            BatchScheduler-->>-gpiIntegration: Batch retry completed
        end

        rect rgb(240, 255, 240)
            Note over AzureSQL, SearchAPI: 📋 STAGE 5: PAYMENT INTEGRATION (Gold Layer)
            
            gpiIntegration->>+AzureSQL: 12. Update ODS for operational dashboards
            Note over AzureSQL: 🏆 Latest status per payment (Gold layer - ODS)
            Note over AzureSQL: 🎯 Target Benefit: Latest status for CSRs, Ops, and clients
            AzureSQL-->>-gpiIntegration: ODS updated
            
            gpiIntegration->>+DataLake: 13. Store full history in Data Lake
            Note over DataLake: 📊 Enriched data for reconciliation, BI, fraud, SLA audits
            Note over DataLake: 🎯 Target Benefit: Reduced investigation costs
            DataLake-->>-gpiIntegration: Data Lake updated
            
            gpiIntegration->>+SearchAPI: 14. Client or Ops queries status by UETR
            Note over SearchAPI: 🔍 If not found → trigger gpi call for latest status
            SearchAPI->>SearchAPI: API triggers gpi call if payment not in ODS
            SearchAPI-->>Individual: 📱 Real-time status update & completion alert
            Note over Individual: 🎯 Target Benefits: Completion Alert & Clarity who payment is from
        end

    else ❌ Payment Rejected
        WorkflowEngine-->>PaymentInitSvc: Rejection with detailed reason
        PaymentInitSvc-->>Individual: 🚫 Rejection notice with compliance details
        PaymentInitSvc->>AuditService: Log rejection event
    end

    Note over Individual, SearchAPI: 🎯 TARGET BENEFITS ACHIEVED
    Note over Individual: ✅ Transparency: Upfront fees/rates display
    Note over Individual: ✅ Traceability: End-to-end UETR tracking via gpi
    Note over Individual: ✅ Completion Alert: Real-time notifications
    Note over SWIFTNetwork: ✅ Payment Accuracy: Structured data reduces errors
    Note over Individual: ✅ Sender Clarity: Enhanced party identification
    Note over DataLake: ✅ Reduced Investigations: Rich data quality
    Note over ComplianceEngine: ✅ Fraud Screening: P2P-specific risk patterns
    Note over SearchAPI: ✅ Product Effectiveness: Competitive vs non-bank providers

    Note over Individual, SearchAPI: 🏛️ BIAN DOMAINS: Payment Initiation, Payment Execution, Party Authentication, Fraud Detection
    Note over PaymentDB, DataLake: 🥉🥈🥇 DATA MEDALLION: Bronze (Raw) → Silver (Validated) → Gold (Analytics-Ready)
```

## Use-Case 1a Enhancements: 5-Stage Lifecycle with Target Benefits

### 14-Process-Step Mapping to Target Benefits

| Stage | Process Step | System/Tool | Data Layer | SWIFT Messages/API | Target Benefits Achieved |
|-------|--------------|-------------|------------|-------------------|-------------------------|
| **1. Payment Initiation** | 1. Client initiates payment request | Corporate Portal, API Gateway | Bronze | MT101/pain.001 (MX) | 🎯 **Transparency**: UETR generation, client details validation |
| | 2. Validate payment details and FX rate | Payment Initiation Service, FX Gateway | Bronze | — | 🎯 **Transparency**: Real-time FX rates, fee calculation |
| | 3. Persist request with UETR | Payment DB/Kafka Ingestion | Bronze | — | 🎯 **Traceability**: Immutable audit trail with UETR |
| **2. Payment Approval** | 4. Dual approval workflow | Workflow Engine (Camunda) | Silver | — | 🎯 **Payment Accuracy**: Role-based approval prevents errors |
| | 5. AML/OFAC screening | Compliance Engine | Silver | — | 🎯 **Fraud Screening**: Enhanced P2P risk patterns |
| | 6. Status change & audit logging | Audit Service + Kafka | Silver | — | 🎯 **Reduced Investigations**: Complete audit trail |
| **3. Payment Gateway** | 7. Format message for legacy/ISO 20022 | Payment Formatter Microservice | Silver | MT103/pacs.008 (MX) | 🎯 **Payment Accuracy**: Proper MT-MX mapping |
| | 8. Send payment to SWIFT Network | SWIFT Gateway Integration | Silver | Sent via SWIFT with UETR | 🎯 **Sender Clarity**: Structured party data transmission |
| **4. Routing & Execution** | 9. Routing via correspondent banks | SWIFT Network | N/A | UETR propagates via MT/MX | 🎯 **Traceability**: End-to-end UETR tracking |
| | 10. Retrieve real-time status | gpi Integration Microservice | Gold | get_payment_status API | 🎯 **Completion Alert**: Real-time status updates |
| | 11. Retry logic if no update | Batch Job Scheduler + Retry Logic | Bronze→Silver→Gold | get_payment_status, track_payment API | 🎯 **Product Effectiveness**: Reduced latency |
| **5. Payment Integration** | 12. Update ODS for dashboards | Azure SQL/PostgreSQL (ODS) | Gold | — | 🎯 **Transparency**: Latest status for CSRs, Ops, clients |
| | 13. Store full history in Data Lake | Azure Data Lake/S3 + Databricks | Gold | — | 🎯 **Reduced Investigations**: Rich analytics data |
| | 14. Client/Ops queries status by UETR | Search API/Dashboard | Gold | If not found → trigger gpi call | 🎯 **Completion Alert**: Proactive customer notifications |

### BIAN Service Domain Architecture Integration

#### Core BIAN Domains Implemented
- **Payment Initiation**: Client onboarding, payment instruction capture, UETR generation
- **Payment Execution**: SWIFT network integration, correspondent banking, settlement
- **Party Authentication**: Enhanced party validation with structured data (DOB, POB)
- **Fraud Detection**: P2P-specific AML/OFAC screening patterns
- **Customer Case Management**: Investigation reduction through enriched data
- **Product Deployment**: Competitive positioning vs non-bank providers

#### Data Medallion Architecture (Bronze → Silver → Gold)
- **Bronze Layer**: Raw event ingestion with immutable UETR audit trail
- **Silver Layer**: Validated, enriched data with compliance screening results
- **Gold Layer**: Analytics-ready data for operational dashboards and BI

### Target Benefits Achievement Matrix

#### ✅ Transparency of Fees, Rates and Timing
- **Process Steps 1-2**: Real-time FX rate calculation and fee breakdown display
- **Process Step 12**: Operational dashboard with latest payment status
- **Implementation**: Upfront cost display before payment confirmation

#### ✅ Traceability
- **Process Steps 3, 9**: UETR generation and end-to-end propagation
- **Process Steps 10-11**: Real-time gpi API tracking with retry logic
- **Implementation**: Complete payment journey visibility via UETR

#### ✅ Completion Alert
- **Process Steps 10, 14**: Real-time status updates and proactive notifications
- **Implementation**: Mobile push notifications and email alerts upon completion

#### ✅ Payment Accuracy (Low likelihood of misrouted payments)
- **Process Steps 4, 7**: Dual approval workflow and proper message formatting
- **Process Step 8**: Structured party data transmission via ISO 20022
- **Implementation**: Enhanced data quality reduces routing errors

#### ✅ Clarity who the payment is from
- **Process Step 8**: Structured party identification in SWIFT messages
- **Implementation**: Enhanced debtor information with DOB, POB, structured addresses

#### ✅ Reduced Investigation Costs
- **Process Steps 6, 13**: Complete audit logging and data lake storage
- **Implementation**: Rich data quality enables automated reconciliation

#### ✅ Improved Fraud Screening
- **Process Step 5**: P2P-specific AML/OFAC screening patterns
- **Implementation**: Enhanced risk scoring for remittance transactions

#### ✅ Improved Product Effectiveness
- **Process Steps 11-14**: Reduced latency through batch optimization and real-time queries
- **Implementation**: Competitive advantage through superior customer experience

### SWIFT Message Types and API Integration

#### Message Flow Mapping
1. **MT101/pain.001**: Initial payment instruction capture (Bronze layer)
2. **pacs.008**: Formatted payment message with GP2P category (Silver layer)
3. **MT103**: Legacy fallback format if required (Silver layer)
4. **pacs.002**: Status confirmations and updates (Gold layer)
5. **gpi APIs**: Real-time tracking and status retrieval (Gold layer)

#### API Integration Points
- `get_payment_status`: Real-time status retrieval every 4 hours
- `track_payment`: Enhanced tracking for P2P remittances
- Search API: UETR-based status queries with gpi fallback triggers
1. **Initial Capture**: Structured party data collection at source
2. **Validation**: Real-time validation of addresses and party information
3. **Fee Calculation**: Transparent cost computation with regulatory compliance
4. **Enhanced Screening**: P2P-specific risk assessment algorithms
5. **Status Tracking**: gpi-enabled tracking with consumer-friendly notifications

#### Data Quality Requirements
- All addresses must include structured elements (street, building, postal code, city, country)
- Individual identification must include DOB and place of birth
- Fee breakdown must be itemized and displayed in local currency
- UETR must be provided at payment initiation for end-to-end tracking
