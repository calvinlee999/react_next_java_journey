# Analytics Sequence Diagrams

## Real-Time Streaming Analytics Sequence

```mermaid
sequenceDiagram
    participant Client as Transaction Client
    participant Kafka as Kafka Topics
    participant DLT as Delta Live Tables
    participant Bronze as Bronze Layer
    participant Silver as Silver Layer  
    participant Gold as Gold Layer
    participant ML as ML Models
    participant Dashboard as Real-Time Dashboard
    participant Alerts as Alert System

    Client->>Kafka: Transaction Event
    Kafka->>DLT: Stream Event
    DLT->>Bronze: Raw Data Ingestion
    Bronze->>DLT: Validate Schema
    DLT->>Silver: Transform & Cleanse
    Silver->>DLT: Apply Business Rules
    DLT->>Gold: Aggregate Metrics
    
    Gold->>ML: Feature Engineering
    ML->>Gold: Fraud Score
    
    Gold->>Dashboard: Real-time Metrics
    Dashboard->>Client: Live Updates (WebSocket)
    
    alt Fraud Detected
        ML->>Alerts: High Risk Score
        Alerts->>Dashboard: Fraud Alert
        Dashboard->>Client: Alert Notification
    end
    
    Note over Bronze,Gold: Delta Lake ACID Transactions
    Note over DLT: Continuous Processing (24/7)
    Note over Dashboard: 2-second refresh rate
```

## Batch Processing Analytics Sequence

```mermaid
sequenceDiagram
    participant Scheduler as Azure Scheduler
    participant ADF as Azure Data Factory
    participant Databricks as Databricks Cluster
    participant Bronze as Bronze Layer
    participant Silver as Silver Layer
    participant Gold as Gold Layer
    participant PowerBI as Power BI Service
    participant Recipients as Report Recipients
    participant Monitor as Azure Monitor

    Scheduler->>ADF: Trigger Daily Batch Job
    ADF->>Databricks: Start Cluster
    Databricks->>Bronze: Load Historical Data
    Bronze->>Databricks: Data Validation
    
    Databricks->>Silver: Data Transformation
    Silver->>Databricks: Business Logic Processing
    Databricks->>Gold: Generate KPIs
    
    Gold->>Databricks: Data Quality Checks
    Databricks->>PowerBI: Refresh Datasets
    PowerBI->>PowerBI: Generate Reports
    
    PowerBI->>Recipients: Email Weekly Reports
    PowerBI->>Recipients: Email Monthly Reports
    
    Databricks->>Monitor: Job Metrics
    Monitor->>Recipients: Success Notification
    
    alt Data Quality Issues
        Databricks->>Monitor: Quality Alert
        Monitor->>Recipients: Error Notification
    end
    
    Note over Databricks: Optimized Spark Jobs
    Note over Gold: Business-ready Metrics
    Note over PowerBI: Scheduled Refresh
```

## Business Intelligence Report Generation Sequence

```mermaid
sequenceDiagram
    participant User as Business User
    participant BI as BI Dashboard
    participant PowerBI as Power BI Service
    participant Gold as Gold Layer (Delta)
    participant Unity as Unity Catalog
    participant Cache as Query Cache
    participant Databricks as Databricks SQL

    User->>BI: Request Monthly Report
    BI->>PowerBI: Load BI Component
    PowerBI->>Unity: Check Permissions
    Unity->>PowerBI: Grant Access
    
    PowerBI->>Cache: Check Query Cache
    alt Cache Hit
        Cache->>PowerBI: Cached Results
    else Cache Miss
        PowerBI->>Databricks: Execute SQL Query
        Databricks->>Gold: Query Delta Tables
        Gold->>Databricks: Return Results
        Databricks->>PowerBI: Query Results
        PowerBI->>Cache: Store Results
    end
    
    PowerBI->>BI: Render Visualizations
    BI->>User: Display KPI Dashboard
    
    User->>BI: Export Report
    BI->>PowerBI: Generate PDF/Excel
    PowerBI->>User: Download Report
    
    Note over Unity: Data Governance
    Note over Cache: Performance Optimization
    Note over Gold: Analytics-ready Data
```

## Data Pipeline Health Monitoring Sequence

```mermaid
sequenceDiagram
    participant Monitor as Azure Monitor
    participant DLT as Delta Live Tables
    participant Pipeline as Data Pipeline
    participant Metrics as Pipeline Metrics
    participant Alerts as Alert Manager
    participant OnCall as On-Call Engineer
    participant Dashboard as Health Dashboard

    Pipeline->>Metrics: Pipeline Execution
    Metrics->>Monitor: Performance Data
    Monitor->>Monitor: Evaluate Thresholds
    
    alt Pipeline Healthy
        Monitor->>Dashboard: Green Status
        Dashboard->>Dashboard: Update Health UI
    else Pipeline Issues
        Monitor->>Alerts: Trigger Alert
        Alerts->>OnCall: Page Engineer
        OnCall->>Pipeline: Investigate Issue
        Pipeline->>OnCall: Diagnostic Info
        OnCall->>Pipeline: Apply Fix
        Pipeline->>Monitor: Recovery Status
        Monitor->>Dashboard: Update Status
    end
    
    DLT->>Metrics: Table Quality Metrics
    Metrics->>Monitor: Data Quality Score
    Monitor->>Dashboard: Quality Dashboard
    
    Note over Monitor: Real-time Monitoring
    Note over Alerts: PagerDuty Integration
    Note over Dashboard: Live Status Updates
```

## Fraud Detection ML Pipeline Sequence

```mermaid
sequenceDiagram
    participant Transaction as Transaction Stream
    participant Features as Feature Store
    participant Model as ML Model
    participant Scoring as Real-time Scoring
    participant Threshold as Risk Threshold
    participant Action as Fraud Action
    participant Feedback as Human Feedback
    participant Retraining as Model Retraining

    Transaction->>Features: Extract Features
    Features->>Model: Feature Vector
    Model->>Scoring: Fraud Probability
    Scoring->>Threshold: Risk Score
    
    alt High Risk (Score > 0.8)
        Threshold->>Action: Block Transaction
        Action->>Transaction: Transaction Denied
        Action->>Feedback: Log for Review
    else Medium Risk (0.5 < Score <= 0.8)
        Threshold->>Action: Flag for Review
        Action->>Feedback: Manual Review Queue
        Feedback->>Action: Human Decision
    else Low Risk (Score <= 0.5)
        Threshold->>Transaction: Allow Transaction
    end
    
    Feedback->>Features: Label Data
    Features->>Retraining: Training Dataset
    Retraining->>Model: Updated Model
    
    Note over Model: MLflow Model Registry
    Note over Scoring: Sub-second latency
    Note over Feedback: Continuous Learning
```

## Power BI DirectQuery Sequence

```mermaid
sequenceDiagram
    participant User as Business Analyst
    participant PowerBI as Power BI Desktop
    participant Service as Power BI Service
    participant Gateway as Data Gateway
    participant Databricks as Databricks SQL
    participant Delta as Delta Lake

    User->>PowerBI: Open Report
    PowerBI->>Service: Load Report Definition
    Service->>Gateway: Query Request
    Gateway->>Databricks: SQL Query
    
    Databricks->>Delta: Query Optimization
    Delta->>Databricks: Delta Files
    Databricks->>Gateway: Query Results
    Gateway->>Service: Data Response
    Service->>PowerBI: Render Visuals
    PowerBI->>User: Interactive Report
    
    User->>PowerBI: Filter Data
    PowerBI->>Service: New Query
    Service->>Gateway: Filtered Query
    Gateway->>Databricks: WHERE Clause
    Databricks->>Delta: Predicate Pushdown
    Delta->>Databricks: Filtered Results
    Databricks->>Gateway: Response
    Gateway->>Service: Updated Data
    Service->>PowerBI: Refresh Visuals
    PowerBI->>User: Updated Report
    
    Note over Databricks: Query optimization
    Note over Delta: Column pruning & predicate pushdown
    Note over Gateway: Secure connectivity
```

## Weekly Business Review Sequence

```mermaid
sequenceDiagram
    participant Scheduler as Weekly Scheduler
    participant Pipeline as Analytics Pipeline  
    participant Gold as Gold Layer
    participant PowerBI as Power BI
    participant Template as Report Template
    participant Email as Email Service
    participant Executives as Executive Team
    participant Storage as Report Archive

    Scheduler->>Pipeline: Trigger Weekly Job
    Pipeline->>Gold: Calculate Weekly KPIs
    Gold->>Pipeline: Business Metrics
    
    Pipeline->>PowerBI: Refresh Weekly Dataset
    PowerBI->>Template: Apply Report Template
    Template->>PowerBI: Formatted Report
    
    PowerBI->>Email: Generate Email Report
    Email->>Executives: Send Weekly Summary
    
    PowerBI->>Storage: Archive Report
    Storage->>Storage: Version Control
    
    Executives->>PowerBI: Access Interactive Report
    PowerBI->>Executives: Drill-down Analytics
    
    Note over Pipeline: Automated execution
    Note over Template: Consistent formatting
    Note over Storage: Audit trail
```

## Data Lineage Tracking Sequence

```mermaid
sequenceDiagram
    participant Source as Data Source
    participant Bronze as Bronze Layer
    participant Silver as Silver Layer
    participant Gold as Gold Layer
    participant Unity as Unity Catalog
    participant Lineage as Data Lineage
    participant Analyst as Data Analyst
    participant Audit as Audit Log

    Source->>Bronze: Data Ingestion
    Bronze->>Unity: Register Table
    Unity->>Lineage: Record Source Mapping
    
    Bronze->>Silver: Data Transformation
    Silver->>Unity: Register Transformed Table
    Unity->>Lineage: Record Transformation
    
    Silver->>Gold: Business Aggregation
    Gold->>Unity: Register Analytics Table
    Unity->>Lineage: Record Aggregation
    
    Analyst->>Unity: Query Lineage
    Unity->>Lineage: Retrieve Lineage Graph
    Lineage->>Analyst: Display Data Flow
    
    Unity->>Audit: Log Access
    Audit->>Audit: Compliance Tracking
    
    Note over Unity: Centralized Metadata
    Note over Lineage: End-to-end Traceability
    Note over Audit: Governance Compliance
```

## Key Sequence Characteristics

### Real-Time Processing
- **Latency**: Sub-second to 2-second processing
- **Throughput**: 10,000+ events per second  
- **Scalability**: Auto-scaling based on load
- **Reliability**: Checkpointing and exactly-once semantics

### Batch Processing
- **Schedule**: Daily, weekly, monthly cadence
- **Volume**: Petabyte-scale data processing
- **Optimization**: Spark optimization and caching
- **Monitoring**: Comprehensive job monitoring

### Business Intelligence
- **Interactivity**: Real-time dashboard updates
- **Performance**: Query caching and optimization
- **Security**: Role-based access control
- **Governance**: Data lineage and audit trails

### Machine Learning
- **Training**: Automated model retraining
- **Serving**: Real-time model inference
- **Monitoring**: Model performance tracking
- **Feedback**: Continuous learning loop

### Data Quality
- **Validation**: Schema and data quality checks
- **Monitoring**: Continuous quality monitoring
- **Alerting**: Automated quality alerts
- **Remediation**: Data quality improvement workflows