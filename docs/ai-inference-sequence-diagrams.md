# AI Inference Sequence Diagrams

This document contains detailed sequence diagrams showing the request/response flows, timing, and data paths for all three AI inference modes.

## Real-Time Inference Sequence Diagram

### Interactive Request Flow (25-100ms)

```mermaid
sequenceDiagram
    participant U as User/Client
    participant LB as Load Balancer
    participant AG as API Gateway
    participant RC as Redis Cache
    participant IM as In-Memory Cache
    participant AI as AI Service
    participant Mon as Monitoring

    Note over U,Mon: Real-Time Inference (Target: 25-100ms)
    
    U->>+LB: HTTP Request with prompt
    Note right of U: t=0ms
    
    LB->>+AG: Route to healthy instance
    Note right of LB: t=5ms (routing)
    
    AG->>+AG: Authenticate & Rate Limit
    Note right of AG: t=10ms (auth check)
    
    AG->>+RC: Check cache key
    Note right of AG: t=15ms
    
    alt Cache Hit (80% probability)
        RC-->>-AG: Return cached response
        Note right of RC: t=20ms (Redis lookup)
        AG-->>-LB: Cached response
        LB-->>-U: Response (200 OK)
        Note right of U: t=25ms TOTAL
    else Cache Miss (20% probability)
        RC-->>AG: Cache miss
        Note right of RC: t=20ms
        
        AG->>+IM: Check in-memory cache
        Note right of AG: t=22ms
        
        alt In-Memory Hit (50% of misses)
            IM-->>-AG: Return cached response
            Note right of IM: t=25ms
            AG->>RC: Store in Redis for future
            AG-->>-LB: Response
            LB-->>-U: Response (200 OK)
            Note right of U: t=30ms TOTAL
        else Complete Miss
            IM-->>AG: Miss
            Note right of IM: t=25ms
            
            AG->>+AI: AI inference request
            Note right of AG: t=30ms
            
            AI->>AI: Process with GPT-4 Turbo
            Note right of AI: t=30-80ms (AI processing)
            
            AI-->>-AG: AI response
            Note right of AI: t=80ms
            
            par Store in caches
                AG->>RC: Store in Redis
                AG->>IM: Store in memory
            and Return response
                AG-->>-LB: Response
                LB-->>-U: Response (200 OK)
            end
            Note right of U: t=90ms TOTAL
        end
    end
    
    AG->>+Mon: Log metrics (async)
    Mon-->>-AG: Logged
    Note right of Mon: Performance tracking
```

### WebSocket Real-Time Updates

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Gateway
    participant AG as API Gateway
    participant AI as AI Service
    participant RC as Redis Cache

    Note over C,RC: Real-Time Streaming Inference
    
    C->>+WS: Establish WebSocket connection
    WS-->>-C: Connection established
    
    loop Continuous Interaction
        C->>+WS: Stream partial prompt
        WS->>+AG: Process partial input
        
        AG->>+RC: Check partial match cache
        alt Partial Match Found
            RC-->>-AG: Partial suggestions
            AG-->>-WS: Incremental response
            WS-->>C: Real-time suggestions
        else No Match
            RC-->>AG: No match
            AG->>+AI: Incremental AI call
            AI-->>-AG: Partial AI response
            AG-->>-WS: Streaming response
            WS-->>C: Real-time AI output
        end
        
        Note right of C: Sub-100ms per interaction
    end
```

## Near-Real-Time Inference Sequence Diagram

### Event Streaming Flow (500ms-1s)

```mermaid
sequenceDiagram
    participant E as Event Source
    participant IG as Ingestion Gateway
    participant K as Kafka Cluster
    participant SS as Spark Streaming
    participant ML as ML Engine
    participant CS as Cosmos DB
    participant WS as WebSocket
    participant C as Client

    Note over E,C: Near-Real-Time Stream Processing (500ms-1s batches)
    
    E->>+IG: Stream of events
    Note right of E: t=0ms - Event generated
    
    IG->>IG: Event validation & enrichment
    Note right of IG: t=10ms - Processing
    
    IG->>+K: Publish to Kafka topic
    Note right of IG: t=20ms - Kafka publish
    K-->>-IG: Ack
    
    par Micro-batch Collection
        loop Every 500ms
            SS->>+K: Poll for new events
            K-->>-SS: Batch of events (100-1000 events)
            Note right of K: t=500ms - Batch ready
            
            SS->>SS: Aggregate & transform events
            Note right of SS: t=550ms - Data processing
            
            SS->>+ML: Batch inference request
            Note right of SS: t=600ms
            
            ML->>ML: Feature engineering
            Note right of ML: t=650ms - ML processing
            
            ML->>ML: Model inference (batch)
            Note right of ML: t=750ms - Batch prediction
            
            ML-->>-SS: Batch predictions
            Note right of ML: t=850ms
            
            SS->>+CS: Store results
            CS-->>-SS: Stored
            Note right = CS: t=900ms - Persistence
            
            SS->>+WS: Publish results
            WS-->>-SS: Published
            Note right of WS: t=950ms
        end
    and Real-time Client Updates
        WS->>+C: Push batch results
        C-->>-WS: Ack received
        Note right of C: t=1000ms TOTAL - Client updated
    end
```

### Fraud Detection Example Flow

```mermaid
sequenceDiagram
    participant T as Transaction
    participant API as API Gateway
    participant K as Kafka
    participant FD as Fraud Detection
    participant ML as ML Model
    participant DB as Database
    participant A as Alert System

    Note over T,A: Fraud Detection Pipeline (Near-Real-Time)
    
    T->>+API: Transaction request
    Note right of T: Credit card transaction
    
    API->>API: Basic validation
    API->>+K: Publish transaction event
    K-->>-API: Event queued
    
    API-->>-T: Transaction accepted (provisional)
    Note right of T: Immediate response to user
    
    rect rgb(255, 245, 235)
        Note over K,A: Background Processing (500ms window)
        
        FD->>+K: Poll transaction batch
        K-->>-FD: 100+ transactions
        
        FD->>FD: Feature engineering
        Note right of FD: Risk indicators, patterns
        
        FD->>+ML: Batch risk scoring
        ML-->>-FD: Risk scores (0-100)
        
        alt High Risk Detected (Score > 80)
            FD->>+DB: Update transaction status
            DB-->>-FD: Updated
            
            FD->>+A: Trigger fraud alert
            A-->>-FD: Alert sent
            
            A->>T: Block transaction notification
        else Low Risk (Score < 20)
            FD->>+DB: Confirm transaction
            DB-->>-FD: Confirmed
        else Medium Risk (20-80)
            FD->>+A: Manual review queue
            A-->>-FD: Queued for review
        end
    end
    
    Note right of T: Final decision in ~1 second
```

## Batch Processing Sequence Diagram

### Large Dataset Processing Flow (5min-1hr)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload Interface
    participant FS as File Service
    participant BS as Blob Storage
    participant AF as Airflow
    participant DB as Databricks
    participant ML as ML Pipeline
    participant SQL as Azure SQL
    participant N as Notification

    Note over U,N: Batch Processing Pipeline (5min-1hr)
    
    U->>+UI: Upload large dataset
    Note right of U: t=0 - 100GB+ file upload
    
    UI->>UI: File validation & chunking
    Note right of UI: t=30s - Multipart upload
    
    UI->>+FS: Process file upload
    FS->>+BS: Store in data lake
    BS-->>-FS: File stored
    FS-->>-UI: Upload complete
    
    UI-->>-U: Upload confirmed
    Note right of U: t=2min - Upload phase complete
    
    FS->>+AF: Trigger processing job
    Note right of FS: t=2min - Job scheduling
    
    AF->>AF: Job planning & resource allocation
    Note right of AF: t=3min - Workflow orchestration
    
    AF->>+DB: Start Databricks cluster
    Note right of AF: t=5min - Cluster startup
    
    DB->>DB: Auto-scale cluster based on data size
    Note right of DB: t=7min - Resource provisioning
    
    DB-->>-AF: Cluster ready
    
    rect rgb(240, 248, 255)
        Note over AF,SQL: Batch Processing Phase
        
        AF->>+DB: Execute ETL pipeline
        Note right of AF: t=10min - Processing starts
        
        loop Data Processing Stages
            DB->>+BS: Read data chunks
            BS-->>-DB: Data partition
            
            DB->>DB: Data cleaning & transformation
            Note right of DB: Parallel processing
            
            DB->>+ML: ML model training/inference
            ML-->>-DB: Model results
            
            DB->>+SQL: Store intermediate results
            SQL-->>-DB: Stored
        end
        
        Note right of DB: t=45min - Processing complete
        
        DB->>+SQL: Store final results
        SQL-->>-DB: Final storage complete
        
        DB-->>-AF: Job completed successfully
    end
    
    AF->>+N: Send completion notification
    N->>U: Email/SMS notification
    N-->>-AF: Notification sent
    
    Note right of U: t=50min TOTAL - Job complete
    
    U->>+UI: View results dashboard
    UI->>+SQL: Query processed data
    SQL-->>-UI: Result summary
    UI-->>-U: Results displayed
```

### ML Model Training Workflow

```mermaid
sequenceDiagram
    participant DS as Data Scientist
    participant ML as ML Workspace
    participant AF as Airflow
    participant DB as Databricks
    participant AML as Azure ML
    participant REG as Model Registry
    participant API as API Service

    Note over DS,API: Model Training & Deployment Pipeline
    
    DS->>+ML: Submit training job
    Note right of DS: New model version request
    
    ML->>ML: Validate training configuration
    ML->>+AF: Schedule training pipeline
    AF-->>-ML: Job scheduled
    
    ML-->>-DS: Training job submitted
    
    rect rgb(245, 255, 245)
        Note over AF,REG: Automated Training Pipeline
        
        AF->>+DB: Provision training cluster
        DB-->>-AF: Cluster ready
        
        AF->>+DB: Execute data preparation
        DB->>DB: Feature engineering pipeline
        DB->>DB: Data validation & splitting
        Note right of DB: Train/validation/test split
        
        DB->>+AML: Submit training job
        AML->>AML: Hyperparameter tuning
        AML->>AML: Model training (distributed)
        AML->>AML: Model evaluation
        Note right of AML: 30min - 2hr training time
        
        AML-->>-DB: Training metrics & model
        
        alt Model Meets Quality Threshold
            DB->>+REG: Register new model version
            REG-->>-DB: Model registered
            
            DB->>+API: Deploy to staging
            API-->>-DB: Deployed successfully
            
            AF->>+DS: Training success notification
            DS-->>-AF: Acknowledged
        else Model Quality Below Threshold
            AF->>+DS: Training failed notification
            DS-->>-AF: Acknowledged
            Note right of DS: Manual intervention required
        end
    end
```

## Error Handling & Recovery Sequences

### Real-Time Error Recovery

```mermaid
sequenceDiagram
    participant C as Client
    participant LB as Load Balancer
    participant AG1 as API Gateway 1
    participant AG2 as API Gateway 2
    participant AI as AI Service
    participant Mon as Monitoring

    Note over C,Mon: Error Handling & Recovery
    
    C->>+LB: Request
    LB->>+AG1: Route to primary
    
    AG1->>+AI: AI request
    AI-->>AG1: Service unavailable (503)
    AG1-->>LB: Error response
    
    rect rgb(255, 240, 240)
        Note over LB,Mon: Error Recovery Flow
        
        LB->>+Mon: Log error & health check
        Mon-->>-LB: Mark AG1 unhealthy
        
        LB->>+AG2: Retry on secondary
        AG2->>+AI: Retry AI request
        AI-->>-AG2: Success response
        AG2-->>-LB: Success
    end
    
    LB-->>-C: Success (with retry)
    Note right of C: Transparent failover
```

### Batch Job Recovery

```mermaid
sequenceDiagram
    participant AF as Airflow
    participant DB as Databricks
    participant BS as Blob Storage
    participant CK as Checkpoint
    participant AL as Alert System

    Note over AF,AL: Batch Job Failure Recovery
    
    AF->>+DB: Start batch job
    DB->>+BS: Process data partition 1
    BS-->>-DB: Success
    
    DB->>+CK: Save checkpoint
    CK-->>-DB: Checkpoint saved
    
    DB->>+BS: Process data partition 2
    BS-->>DB: Network timeout (failure)
    
    rect rgb(255, 240, 240)
        Note over DB,AL: Recovery Process
        
        DB->>+AL: Job failure alert
        AL-->>-DB: Alert sent
        
        AF->>AF: Detect job failure
        AF->>+DB: Restart from last checkpoint
        
        DB->>+CK: Load checkpoint
        CK-->>-DB: Resume from partition 2
        
        DB->>+BS: Retry failed partition
        BS-->>-DB: Success
    end
    
    DB-->>-AF: Job completed
    Note right of AF: Automatic recovery successful
```

## Performance Optimization Patterns

### Connection Pooling & Caching

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant C2 as Client 2
    participant AG as API Gateway
    participant CP as Connection Pool
    participant RC as Redis Cluster
    participant AI as AI Service

    Note over C1,AI: Optimized Resource Usage
    
    par Concurrent Requests
        C1->>+AG: Request A
        AG->>+CP: Get AI connection
        CP-->>-AG: Reuse existing connection
        AG->>+AI: Request via pooled connection
        
    and
        C2->>+AG: Request B  
        AG->>+CP: Get AI connection
        CP-->>-AG: New connection from pool
        AG->>+AI: Request via pooled connection
    end
    
    par Responses
        AI-->>-AG: Response A
        AG->>+RC: Cache response A
        RC-->>-AG: Cached
        AG-->>-C1: Response A
        
    and
        AI-->>-AG: Response B
        AG->>+RC: Cache response B  
        RC-->>-AG: Cached
        AG-->>-C2: Response B
    end
    
    Note over CP: Connection pool reduces overhead
    Note over RC: Response caching improves latency
```

---

*These sequence diagrams represent the current implementation and are updated as the system evolves.*