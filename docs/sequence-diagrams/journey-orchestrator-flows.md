# 🎯 Journey Orchestrator Sequence Diagrams

> **Detailed workflow diagrams for the Journey Orchestrator service and event-driven patterns**

## 🔄 Journey Orchestration Workflows

### 1. 🏦 Loan Application Journey Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ React Frontend
    participant Gateway as 🚪 API Gateway
    participant Journey as 🎯 Journey Orchestrator
    participant UserSvc as 👥 User Service
    participant AI as 🤖 AI Service
    participant Notifications as 🔔 Notification Service
    participant Kafka as 🌊 Kafka
    participant Database as 💾 Database

    User->>Frontend: Submit Loan Application
    Frontend->>Gateway: POST /api/journeys/loan-application
    Gateway->>Journey: Forward Request
    
    Note over Journey: Journey State: INITIATED
    Journey->>Database: Save Journey State
    Journey->>Kafka: Publish LoanApplicationSubmitted Event
    Journey->>Frontend: 201 Created (Journey ID)
    
    Note over Journey: Journey State: IN_PROGRESS
    Journey->>UserSvc: Validate User Profile
    UserSvc->>Database: Query User Data
    UserSvc->>Journey: User Validation Result
    
    alt User Profile Valid
        Journey->>AI: Request Credit Assessment
        AI->>Journey: Credit Score & Analysis
        
        Journey->>Kafka: Publish CreditCheckCompleted Event
        Note over Journey: Journey State: ASSESSMENT_COMPLETE
        
        alt Credit Score >= Threshold
            Journey->>Kafka: Publish LoanApplicationApproved Event
            Note over Journey: Journey State: APPROVED
            Journey->>Notifications: Send Approval Notification
        else Credit Score < Threshold
            Journey->>Kafka: Publish LoanApplicationRejected Event
            Note over Journey: Journey State: REJECTED
            Journey->>Notifications: Send Rejection Notification
        end
        
    else User Profile Invalid
        Journey->>Kafka: Publish LoanApplicationFailed Event
        Note over Journey: Journey State: FAILED
        Journey->>Notifications: Send Error Notification
    end
    
    Journey->>Database: Update Final Journey State
    Notifications->>Frontend: Real-time Status Update
    Frontend->>User: Display Final Result
```

### 2. 🎭 Journey Compensation Flow (Saga Pattern)

```mermaid
sequenceDiagram
    participant Journey as 🎯 Journey Orchestrator
    participant UserSvc as 👥 User Service
    participant AI as 🤖 AI Service
    participant Notifications as 🔔 Notification Service
    participant Kafka as 🌊 Kafka
    participant Database as 💾 Database

    Note over Journey: Journey State: IN_PROGRESS
    Journey->>UserSvc: Reserve User Credit Limit
    UserSvc->>Journey: Credit Reserved
    
    Journey->>AI: Process Credit Analysis
    AI->>Journey: Analysis Failed (System Error)
    
    Note over Journey: Trigger Compensation Flow
    Note over Journey: Journey State: COMPENSATING
    
    Journey->>Kafka: Publish CompensationStarted Event
    Journey->>UserSvc: Release Reserved Credit Limit
    UserSvc->>Journey: Credit Limit Released
    
    Journey->>AI: Cancel Pending Analysis
    AI->>Journey: Analysis Cancelled
    
    Journey->>Notifications: Send Compensation Notification
    Journey->>Kafka: Publish CompensationCompleted Event
    
    Note over Journey: Journey State: FAILED
    Journey->>Database: Update Journey State
    Journey->>Notifications: Send Final Error Notification
```

### 3. ⚡ Event-Driven Architecture Comparison Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Demo as 🎨 Event Comparison Demo
    participant WebHook as 🪝 WebHook Handler
    participant Kafka as 🌊 Kafka Producer/Consumer
    participant Journey as 🎯 Journey Orchestrator
    participant Metrics as 📊 Metrics Collector

    User->>Demo: Start All Simulations
    
    par WebHook Pattern
        Demo->>WebHook: Send HTTP Event
        WebHook->>Demo: HTTP 200 Response
        WebHook->>Metrics: Record WebHook Metrics
        Note over WebHook: Throughput: 1K events/sec<br/>Latency: 100-500ms
    
    and Kafka Pattern
        Demo->>Kafka: Publish Event to Topic
        Kafka->>Demo: Acknowledgment
        Kafka->>Metrics: Record Kafka Metrics
        Note over Kafka: Throughput: 1M+ events/sec<br/>Latency: 1-10ms
    
    and Journey Orchestration Pattern
        Demo->>Journey: Start Journey Event
        Journey->>Journey: Update State Machine
        Journey->>Kafka: Publish Journey Event
        Journey->>Demo: Journey State Response
        Journey->>Metrics: Record Journey Metrics
        Note over Journey: Throughput: 15K journeys/sec<br/>Latency: 5-50ms
    end
    
    Metrics->>Demo: Aggregated Performance Data
    Demo->>User: Display Comparison Results
```

## 🌊 Event Flow Patterns

### 4. 📡 Event Publishing and Consumption

```mermaid
sequenceDiagram
    participant Producer as 📤 Event Producer
    participant Kafka as 🌊 Kafka Broker
    participant Schema as 📋 Schema Registry
    participant Consumer1 as 📥 Analytics Consumer
    participant Consumer2 as 📥 Notification Consumer
    participant Consumer3 as 📥 Journey Consumer

    Producer->>Schema: Validate Event Schema
    Schema->>Producer: Schema Valid
    
    Producer->>Kafka: Publish Event to Topic
    Kafka->>Producer: Acknowledgment
    
    par Consumer Group 1
        Kafka->>Consumer1: Deliver Event
        Consumer1->>Consumer1: Process Analytics
        Consumer1->>Kafka: Commit Offset
    
    and Consumer Group 2
        Kafka->>Consumer2: Deliver Event
        Consumer2->>Consumer2: Send Notification
        Consumer2->>Kafka: Commit Offset
    
    and Consumer Group 3
        Kafka->>Consumer3: Deliver Event
        Consumer3->>Consumer3: Update Journey State
        Consumer3->>Kafka: Commit Offset
    end
```

### 5. 🔄 Microservice Communication Flow

```mermaid
sequenceDiagram
    participant Client as 🖥️ Client App
    participant Gateway as 🚪 API Gateway
    participant UserSvc as 👥 User Service
    participant Journey as 🎯 Journey Service
    participant AI as 🤖 AI Service
    participant Cache as 🧠 Redis Cache
    participant DB as 💾 Database
    participant Events as 🌊 Event Bus

    Client->>Gateway: API Request
    Gateway->>Cache: Check Cache
    
    alt Cache Hit
        Cache->>Gateway: Cached Response
        Gateway->>Client: Return Cached Data
    else Cache Miss
        Gateway->>UserSvc: Route to User Service
        UserSvc->>DB: Query Database
        DB->>UserSvc: Return Data
        
        UserSvc->>Events: Publish User Event
        UserSvc->>Cache: Update Cache
        UserSvc->>Gateway: Return Response
        Gateway->>Client: Return Data
        
        Events->>Journey: Trigger Journey Update
        Events->>AI: Trigger AI Analysis
    end
```

## 🧪 Testing Workflows

### 6. 🔬 Journey Testing Flow

```mermaid
sequenceDiagram
    participant Test as 🧪 Test Suite
    participant Journey as 🎯 Journey Orchestrator
    participant MockUser as 👤 Mock User Service
    participant MockAI as 🤖 Mock AI Service
    participant TestDB as 💾 Test Database
    participant TestKafka as 🌊 Test Kafka

    Test->>Journey: Start Test Journey
    Journey->>TestDB: Save Initial State
    Journey->>TestKafka: Publish Start Event
    
    Journey->>MockUser: Validate User
    MockUser->>Journey: Mock Valid User
    
    Journey->>MockAI: Request Analysis
    MockAI->>Journey: Mock Analysis Result
    
    Journey->>TestKafka: Publish Completion Event
    Journey->>TestDB: Update Final State
    Journey->>Test: Return Journey Result
    
    Test->>Test: Assert Journey Completed Successfully
    Test->>TestDB: Verify State Transitions
    Test->>TestKafka: Verify Event Sequence
```

### 7. 📊 Performance Testing Flow

```mermaid
sequenceDiagram
    participant LoadTest as 🏋️ Load Test
    participant Demo as 🎨 Event Demo
    participant WebHook as 🪝 WebHook Handler
    participant Kafka as 🌊 Kafka
    participant Journey as 🎯 Journey Orchestrator
    participant Metrics as 📊 Metrics Collector

    loop Performance Test Suite
        LoadTest->>Demo: Simulate User Load
        
        par WebHook Load Test
            Demo->>WebHook: Send 1000 Events
            WebHook->>Metrics: Record Response Times
            Note over WebHook: Measure: Throughput, Latency, Errors
        
        and Kafka Load Test
            Demo->>Kafka: Send 100K Events
            Kafka->>Metrics: Record Processing Times
            Note over Kafka: Measure: Throughput, Latency, Errors
        
        and Journey Load Test
            Demo->>Journey: Start 10K Journeys
            Journey->>Metrics: Record Orchestration Times
            Note over Journey: Measure: Throughput, Latency, Errors
        end
        
        Metrics->>LoadTest: Aggregate Performance Data
        LoadTest->>LoadTest: Analyze Results
    end
    
    LoadTest->>LoadTest: Generate Performance Report
```

## 🔒 Security and Monitoring Flows

### 8. 🛡️ Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend
    participant Gateway as 🚪 API Gateway
    participant Auth as 🔐 Auth Service
    participant Journey as 🎯 Journey Service
    participant KeyVault as 🔑 Azure Key Vault

    User->>Frontend: Login Request
    Frontend->>Gateway: POST /auth/login
    Gateway->>Auth: Validate Credentials
    Auth->>KeyVault: Get Signing Key
    KeyVault->>Auth: Return Key
    Auth->>Auth: Generate JWT Token
    Auth->>Gateway: Return JWT
    Gateway->>Frontend: Return Token
    
    Frontend->>Gateway: API Request with JWT
    Gateway->>Gateway: Validate JWT
    Gateway->>Journey: Forward Authenticated Request
    Journey->>Gateway: Return Response
    Gateway->>Frontend: Return Data
```

### 9. 📊 Monitoring and Observability Flow

```mermaid
sequenceDiagram
    participant Journey as 🎯 Journey Orchestrator
    participant Metrics as 📊 Application Insights
    participant Tracing as 🔍 Distributed Tracing
    participant Logs as 📝 Log Analytics
    participant Alerts as 🚨 Azure Monitor
    participant Admin as 👨‍💼 Administrator

    Journey->>Metrics: Send Performance Metrics
    Journey->>Tracing: Send Trace Data
    Journey->>Logs: Send Application Logs
    
    Metrics->>Alerts: Check Thresholds
    Tracing->>Alerts: Check Error Rates
    Logs->>Alerts: Check Error Patterns
    
    alt Alert Condition Met
        Alerts->>Admin: Send Alert Notification
        Admin->>Metrics: View Dashboard
        Admin->>Tracing: Investigate Traces
        Admin->>Logs: Analyze Error Logs
    end
    
    Admin->>Journey: Apply Configuration Changes
    Journey->>Metrics: Confirm Changes Applied
```

## 📚 Related Documentation

- [Journey Orchestrator Implementation](../../backend/microservices/journey-orchestrator/README.md)
- [Event Comparison Demo](../../frontend/src/app/event-comparison/README.md)
- [Microservices Architecture](./microservices-architecture.md)
- [API Gateway Configuration](../../backend/microservices/api-gateway/README.md)

---

*These sequence diagrams provide detailed workflow documentation for implementing, testing, and monitoring the Journey Orchestrator and event-driven architecture patterns.*