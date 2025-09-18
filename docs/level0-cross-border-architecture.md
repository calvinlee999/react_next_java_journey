# Level 0 - Cross-Border Payment Lifecycle (Architecture Overview)

This Level 0 architecture provides a high-level view of the cross-border payment lifecycle and summarizes the key systems, message flows and data layers.

## Overview
- Purpose: Provide a single-page Level 0 architecture and sequence diagram for executive and engineering stakeholders.
- Scope: Payment initiation through settlement and status tracking, using ISO 20022 (pacs.008 / pain.001 / pacs.002 / camt.026) and legacy MT mappings where required.

## Key Systems
- Corporate Portal / API Gateway: Client initiation, UIs and API endpoints
- Payment Initiation Service: Validates payments, FX checks, initial persistence
- Workflow Engine: Maker-Checker, AML/Compliance checks
- Payment Formatter: Maps internal model to ISO20022 pacs.008 or MT103/pacs.008 (MX/MT translation)
- SWIFT Gateway: SWIFT messaging and gpi tracking
- Core Banking / Nostro Reconciliation: Balances, confirmations
- Data Lake / ODS: Historical payment records and operational dashboards
- gpi Tracker Integration: Real-time status retrieval via gpi APIs

## Data Layer (Medallion)
- Bronze: Raw ingestion (payment requests, UETR)
- Silver: Enriched events (validation, AML, approvals)
- Gold: Operational datastore (ODS) for reconciliation and dashboards

## High-Level Message Patterns
- Client -> Payment Initiation: pain.001 / pmt initiation API (internal JSON)
- Formatter -> SWIFT Gateway: pacs.008 (MX) / MT103 (converted)
- SWIFT -> Formatter/Core: pacs.002 (payment status) / camt.052 (reconciliation)
- gpi Tracker: get_payment_status API calls

## Next Steps
- Add Level 1 diagrams per subsystem
- Author integration test harness for MX/MT mapping

---

See also: `docs/sequence-diagrams/cross-border-payment-level0.md` for the sequence diagram.
