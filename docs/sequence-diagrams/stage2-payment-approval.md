# Stage 2: Payment Approval - Enhanced UETR Lifecycle
## Detailed Process Flow with UETR State Management and Rejection Handling

```mermaid
sequenceDiagram
    participant PaymentInitSvc as 💰 Payment Initiation Service
    participant ApprovalEngine as ✅ Approval Engine<br/>(Maker-Checker)
    participant ComplianceEngine as 🛡️ Compliance Engine<br/>(AML/OFAC)
    participant DebtorAgent as 🏛️ Debtor Agent<br/>(Sender Bank)
    participant AuditService as 📊 Audit Service
    participant NotificationSvc as 📧 Notification Service
    participant Debtor as 👤 Debtor

    Note over PaymentInitSvc, Debtor: 📋 STAGE 2: PAYMENT APPROVAL - UETR Lifecycle Steps 2.1-2.2

    rect rgb(248, 255, 248)
        Note over PaymentInitSvc, ApprovalEngine: 📋 Step 2.1: Payment Approval & Queue for Gateway
        Note over ApprovalEngine: � UETR State: Ready for Release
        
        PaymentInitSvc->>+ApprovalEngine: Payment message formatted & queued for gateway
        Note over ApprovalEngine: 📄 Message Type: MT103, pacs.008<br/>🔑 Dual approval workflow (Maker-Checker)<br/>💾 Payment ready for SWIFT transmission<br/>🎯 gpi Role: Sender
        
        ApprovalEngine->>+ComplianceEngine: Enhanced AML/OFAC screening
        Note over ComplianceEngine: 🛡️ P2P-specific fraud screening<br/>🔍 Enhanced party validation<br/>📊 Risk scoring and assessment<br/>🎯 Pre-SWIFT compliance validation
        
        ComplianceEngine->>ComplianceEngine: Comprehensive screening process
        Note right of ComplianceEngine: • Sanctions List Check (OFAC, UN, EU)<br/>• PEP (Politically Exposed Person) screening<br/>• High-Risk Country assessment<br/>• Transaction pattern analysis<br/>• Velocity and threshold checks<br/>• Enhanced due diligence for high-risk
        
        ComplianceEngine-->>-ApprovalEngine: Compliance clearance + risk score
        Note over ApprovalEngine: 📊 Risk Assessment Complete<br/>🎯 Enhanced fraud screening achieved
        
        ApprovalEngine->>+DebtorAgent: Queue payment for SWIFT transmission
        Note over DebtorAgent: 📄 Messages: MT103 (:52a), pacs.008<br/>🔑 Payment approved and ready for release<br/>💾 Staged for SWIFT gateway<br/>🎯 gpi Role: Sender Bank
        
        ApprovalEngine->>+AuditService: Log approval decision with UETR
        Note over AuditService: 📋 Silver Layer: Enriched approval data<br/>🔍 Risk scores and compliance metadata<br/>🕒 Approval timestamps and decision trail<br/>👥 Approver identity and workflow steps
        AuditService-->>-ApprovalEngine: Audit trail recorded
    end

    alt ❌ Validation Failed - Pre-SWIFT Rejection
        rect rgb(255, 248, 248)
            Note over DebtorAgent, Debtor: 📋 Step 2.2: Pre-SWIFT Rejection Process
            Note over DebtorAgent: 🔄 UETR State: Rejected (Pre-SWIFT)
            
            DebtorAgent-->>ApprovalEngine: Validation failed - payment rejection
            Note over DebtorAgent: 📄 Message Type: MT199 (:72 optional notes)<br/>🚫 Rejection before SWIFT transmission<br/>💾 Rejection reasons documented<br/>🎯 gpi Role: Rejector
            
            ApprovalEngine->>+NotificationSvc: Send rejection notification
            Note over NotificationSvc: 🚨 Rejection Notification Details<br/>• UETR reference for tracking<br/>• Specific rejection reason codes<br/>• Remediation instructions<br/>• Contact information for support
            
            NotificationSvc-->>+Debtor: Pre-SWIFT rejection notice with UETR
            Note over Debtor: 🎯 Target Benefit: Clear rejection reasons<br/>📞 Support contact for resolution<br/>🔍 UETR for reference and tracking
            
            NotificationSvc->>+AuditService: Log rejection event
            Note over AuditService: 📋 Silver Layer: Rejection audit trail<br/>🚫 Rejection reason codes and timestamps<br/>🔍 Complete UETR state transition history<br/>📊 Rejection analytics for improvement
            AuditService-->>-NotificationSvc: Rejection logged
            NotificationSvc-->>-Debtor: Notification delivery confirmed
        end
    else ✅ Payment Approved for Release
        rect rgb(240, 255, 240)
            Note over DebtorAgent, ApprovalEngine: 📋 Successful Approval Path
            
            DebtorAgent-->>-ApprovalEngine: Ready for SWIFT transmission
            Note over DebtorAgent: ✅ Payment approved and validated<br/>🔄 UETR State: Ready for Release<br/>📤 Queued for Stage 3 (SWIFT Gateway)<br/>🎯 gpi Role: Approved Sender
            
            ApprovalEngine-->>PaymentInitSvc: Approval confirmation with UETR
            Note over PaymentInitSvc: 🎯 Target Benefits Achieved<br/>✅ Payment Accuracy: Dual approval<br/>✅ Enhanced Fraud Screening: Complete<br/>✅ UETR Traceability: State updated
        end
    end

    Note over PaymentInitSvc, Debtor: 🎯 STAGE 2 TARGET BENEFITS ACHIEVED
    Note over ComplianceEngine: ✅ Enhanced Fraud Screening: P2P-specific patterns
    Note over ApprovalEngine: ✅ Payment Accuracy: Dual approval workflow
    Note over AuditService: ✅ Audit Trail: Complete decision history

```

## Enhanced Stage 2 UETR State Management

### UETR State Transitions in Stage 2

| Step | UETR State | Description | MT Message | MX Message | Key Parties |
|------|------------|-------------|------------|------------|-------------|
| **2.1** | **Ready for Release** | Payment approved and queued for SWIFT | MT103 | pacs.008 | Approval Engine, Sender, Debtor Agent |
| **2.2** | **Rejected (Pre-SWIFT)** | Validation failed before SWIFT transmission | MT199 | - | Rejector, Debtor Agent |

### Message Type Progression

| Message Transition | Purpose | UETR State Change | Technical Details |
|---------------------|---------|-------------------|-------------------|
| **Staged → MT103** | SWIFT message preparation | → Ready for Release | ISO 20022 pacs.008 format with party validation |
| **MT103 → MT199** | Pre-SWIFT rejection notification | → Rejected (Pre-SWIFT) | Rejection reason codes and remediation guidance |

### Approval Workflow Integration

| Approval Stage | Risk Level | Action Required | UETR State Impact |
|----------------|------------|-----------------|-------------------|
| **Low Risk (0-30)** | Automatic approval | Single authorization | → Ready for Release |
| **Medium Risk (31-70)** | Manual review | Dual approval required | → Ready for Release (if approved) |
| **High Risk (71-100)** | Enhanced review | Additional compliance checks | → Rejected (Pre-SWIFT) or → Ready for Release |

### Party Role and gpi Integration

| Party | gpi Role | UETR States | Key Responsibilities |
|-------|----------|-------------|---------------------|
| **Approval Engine** | Sender | Ready for Release | Dual approval workflow orchestration |
| **Compliance Engine** | Screening Authority | Ready for Release | AML/OFAC and fraud screening |
| **Debtor Agent** | Sender Bank | Ready → Rejected/Released | SWIFT transmission preparation |
| **Notification Service** | Communicator | Rejected (Pre-SWIFT) | Rejection notification and remediation |

## Stage 2 Process Steps Summary - Enhanced

| Step | Process | System | UETR State | Target Benefit |
|------|---------|--------|------------|----------------|
| **2.1** | Payment Approval & Queue | Approval Engine + Compliance | Ready for Release | ✅ **Enhanced Fraud Screening** |
| **2.2** | Pre-SWIFT Rejection | Debtor Agent + Notification | Rejected (Pre-SWIFT) | ✅ **Payment Accuracy** |

| Step | Process | System | Target Benefit |
|------|---------|--------|----------------|
| **2.1** | Enhanced Risk Assessment | Compliance Engine | Risk Evaluation |
| **2.2** | Fraud Detection Analysis | ML Fraud Detection | ✅ **Fraud Screening** |
| **2.3** | Risk Score Calculation | Fraud Detection + Compliance | Risk Quantification |
| **2.4** | Compliance Decision | Compliance Engine | Regulatory Compliance |
| **2.5** | Dual Approval Logic | Approval Service + Workflow | Authorization Control |
| **2.6** | Data Enrichment (Silver) | Kafka + Data Lake | Audit Enhancement |
| **2.7** | Status Update | Workflow Engine | Process Control |

## Key Technical Components

### Risk Assessment Framework
- **AML/KYC Depth**: Enhanced screening beyond basic checks
- **Geographic Risk**: Country-specific risk factors
- **Transaction Patterns**: Historical behavior analysis
- **ML-Based Detection**: Real-time machine learning models

### Dual Approval Configuration
- **Auto-Approval Threshold**: Risk score 0-30
- **Manual Review Required**: Risk score 31-70
- **High-Risk Block**: Risk score 71-100
- **Maker-Checker Rule**: Minimum 2 approvers for medium/high risk

### BIAN Service Domains
- **Party Authentication**: Enhanced identity verification
- **Fraud Detection**: Primary domain for ML-based screening
- **Customer Case Management**: Approval workflow management

## Data Architecture - Silver Layer

### Enhanced Event Schema
```json
{
  "eventType": "Payment.ComplianceAssessed",
  "uetr": "DEUTDEFFXXX20241115RND123456",
  "timestamp": "2024-01-15T10:35:00Z",
  "riskAssessment": {
    "overallScore": 25,
    "category": "LOW",
    "factors": {
      "amlScore": 15,
      "fraudScore": 18,
      "geographicRisk": 10,
      "behavioralRisk": 12
    }
  },
  "approvalStatus": "AUTO_APPROVED",
  "complianceChecks": {
    "sanctionsScreen": "CLEAR",
    "pepCheck": "CLEAR",
    "fraudDetection": "LOW_RISK"
  }
}
```

## Fraud Detection Models

### ML Model Features
- **Velocity Patterns**: Transaction frequency and amounts
- **Geographic Anomalies**: Unusual destination countries
- **Behavioral Shifts**: Deviations from normal patterns
- **Network Analysis**: Relationship mapping and clustering

### Decision Matrix
| Risk Score | Action | Approval Required | Processing Time |
|------------|--------|-------------------|-----------------|
| 0-30 (LOW) | Auto-approve | None | < 1 minute |
| 31-70 (MEDIUM) | Manual review | Dual approval | 5-15 minutes |
| 71-100 (HIGH) | Block/investigate | Senior + Compliance | 30+ minutes |

## Next Stage
➡️ [Stage 3: Payment Gateway](stage3-payment-gateway.md) - Message formatting and SWIFT transmission