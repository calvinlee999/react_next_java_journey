# Cross-Border Payment Level 0 - Sequence Diagram

```mermaid
sequenceDiagram
    participant Client as Corporate Portal
    participant API as API Gateway
    participant PaymentSvc as Payment Initiation Service
    participant Workflow as Workflow Engine
    participant Formatter as Payment Formatter
    participant SWIFT as SWIFT Gateway (gpi)
    participant Core as Core Banking / Nostro
    participant DataLake as Data Lake / ODS
    participant gpi as gpi Tracker API

    Client->>+API: Submit payment (internal JSON / pain.001)
    API->>+PaymentSvc: Create Payment Request (store UETR)
    PaymentSvc->>+Workflow: Start Maker-Checker & AML
    Workflow->>Workflow: Approve/Reject (human or automated)
    Workflow-->>-PaymentSvc: Approval result

    alt Approved
        PaymentSvc->>+Formatter: Convert to pacs.008 (MX)
        Formatter->>+SWIFT: Send pacs.008 / MT103 (if required)
        SWIFT-->>-Formatter: ACK / pacs.002 (acceptance)
        Formatter-->>-PaymentSvc: Sent confirmation
        PaymentSvc->>+DataLake: Persist payment event (Silver)
        PaymentSvc->>+Core: Debit Accounts / Nostro
        Core-->>-PaymentSvc: Settlement confirmation
        SWIFT->>+gpi: Track payment status
        gpi-->>-SWIFT: gpi status
        SWIFT-->>-PaymentSvc: Final status (pacs.002)
    else Rejected
        PaymentSvc-->>-API: Rejection notice (client)
    end

    Note right of Client: UETR is returned at creation for tracking
```
