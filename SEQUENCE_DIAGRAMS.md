# Architecture Sequence Diagrams

This document contains comprehensive sequence diagrams for the React + Next.js + Java + Azure architecture.

## 1. Monolithic Frontend Architecture Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js App
    participant R as React Components
    participant S as State Management
    participant A as API Layer
    participant J as Java Backend
    participant D as Database

    Note over U,D: Monolithic Frontend User Journey
    
    U->>B: Visit localhost:3000
    B->>N: Load Next.js Application
    N->>N: Server-Side Rendering (SSR)
    N->>R: Hydrate React Components
    R->>S: Initialize State Stores
    
    Note over S: Multi-Pattern State Management
    S->>S: Redux Toolkit (App State)
    S->>S: Zustand (UI State)
    S->>S: Jotai (Atomic State)
    S->>S: React Query (Server State)
    
    U->>R: Interact with Components
    R->>S: Update State
    S->>A: API Request
    A->>J: HTTP Request
    J->>D: Database Query
    D-->>J: Data Response
    J-->>A: JSON Response
    A-->>S: Update Cache
    S-->>R: Re-render Components
    R-->>B: Update DOM
    B-->>U: Visual Feedback
```

## 2. Micro-Frontend Architecture Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant S as Shell App
    participant E as Event Bus
    participant M1 as User MF
    participant M2 as Analytics MF
    participant M3 as Commerce MF
    participant A as API Gateway
    participant J as Java Services

    Note over U,J: Micro-Frontend Portal Architecture
    
    U->>B: Visit localhost:3002
    B->>S: Load Shell Application
    S->>S: Initialize Module Federation
    
    Note over S: Load Micro-Frontends
    S->>M1: Load User Management MF
    S->>M2: Load Analytics MF
    S->>M3: Load E-commerce MF
    
    M1-->>S: Register with Shell
    M2-->>S: Register with Shell
    M3-->>S: Register with Shell
    
    S->>E: Initialize Event Bus
    E->>M1: Subscribe to Events
    E->>M2: Subscribe to Events
    E->>M3: Subscribe to Events
    
    U->>M1: User Action
    M1->>E: Emit Event
    E->>M2: Broadcast Event
    E->>M3: Broadcast Event
    
    M1->>A: API Request
    A->>J: Route to Service
    J-->>A: Response
    A-->>M1: Data
    M1->>E: Update Event
    E->>S: Global State Update
```

## 3. State Management Architecture

```mermaid
sequenceDiagram
    participant C as Component
    participant R as Redux Store
    participant Z as Zustand Store
    participant J as Jotai Atoms
    participant Q as React Query
    participant A as API
    participant B as Backend

    Note over C,B: Multi-Pattern State Management
    
    C->>R: Dispatch Action (App State)
    R->>R: Reducer Updates State
    R-->>C: State Updated
    
    C->>Z: Update Store (UI State)
    Z->>Z: Immer Updates
    Z-->>C: Reactive Update
    
    C->>J: Set Atom (Component State)
    J->>J: Atomic Update
    J-->>C: Atom Value Changed
    
    C->>Q: Query Data (Server State)
    Q->>A: HTTP Request
    A->>B: API Call
    B-->>A: Response
    A-->>Q: Cache Update
    Q-->>C: Data Available
    
    Note over Q: Background Refetch
    Q->>A: Revalidate
    A->>B: Fresh Data
    B-->>A: Updated Response
    A-->>Q: Cache Invalidation
    Q-->>C: Automatic Re-render
```

## 4. Virtual DOM Optimization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant V as Virtual DOM
    participant O as Optimization Layer
    participant M as Memoization
    participant L as Lazy Loading
    participant P as Performance Monitor
    participant D as Real DOM

    Note over U,D: Virtual DOM Optimization Pipeline
    
    U->>C: User Interaction
    C->>O: Component Update
    O->>M: Check Memoization
    
    alt Component Memoized
        M-->>O: Use Cached Result
    else Component Changed
        M->>V: Create Virtual Node
        V->>V: Diff Algorithm
        V->>D: Minimal DOM Updates
    end
    
    O->>L: Check Lazy Loading
    L->>L: Load Components On-Demand
    L->>V: Inject Lazy Components
    
    V->>P: Performance Metrics
    P->>P: Monitor Render Time
    P->>P: Track Memory Usage
    P->>P: Measure FPS
    
    D-->>U: Updated UI
    P-->>C: Performance Feedback
```

## 5. Navigation and Routing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Navigation
    participant R as Router
    participant P as Prefetch
    participant C as Cache
    participant S as Server
    participant B as Breadcrumbs

    Note over U,B: Smart Navigation System
    
    U->>N: Hover on Link
    N->>P: Trigger Prefetch
    P->>C: Check Cache
    
    alt Not in Cache
        P->>S: Prefetch Route
        S-->>P: Route Data
        P->>C: Cache Route
    end
    
    U->>N: Click Link
    N->>R: Navigate to Route
    R->>C: Get Cached Data
    C-->>R: Instant Load
    
    R->>B: Update Breadcrumbs
    B->>B: Calculate Path
    B-->>N: Breadcrumb Trail
    
    R-->>U: Instant Navigation
```

## 6. Error Handling and Fault Isolation

```mermaid
sequenceDiagram
    participant U as User
    participant S as Shell
    participant M as Micro-Frontend
    participant E as Error Boundary
    participant F as Fallback UI
    participant L as Logger
    participant H as Health Monitor

    Note over U,H: Error Handling and Fault Isolation
    
    U->>M: User Action
    M->>M: Processing Error
    M->>E: Error Thrown
    
    E->>E: Catch Error
    E->>L: Log Error Details
    E->>F: Display Fallback UI
    E->>H: Report Health Status
    
    F-->>U: Graceful Degradation
    
    S->>H: Monitor MF Health
    H->>H: Check MF Status
    
    alt MF Unhealthy
        H->>S: MF Unavailable
        S->>F: Show Alternative
        F-->>U: Alternative UI
    else MF Healthy
        H-->>S: MF Available
        S-->>U: Normal Operation
    end
    
    L->>L: Aggregate Errors
    L->>S: Error Analytics
```

## 7. Module Federation Loading

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Shell App
    participant W as Webpack
    participant M as Module Federation
    participant R1 as Remote MF 1
    participant R2 as Remote MF 2
    participant C as Shared Cache

    Note over B,C: Module Federation Runtime Loading
    
    B->>S: Load Shell Application
    S->>W: Initialize Webpack
    W->>M: Setup Module Federation
    
    M->>M: Configure Remotes
    M->>C: Setup Shared Dependencies
    C->>C: Share React, React-DOM
    
    S->>M: Request Remote MF
    M->>R1: Load Remote Bundle
    R1->>W: Webpack Module
    W->>C: Check Shared Deps
    
    alt Shared Deps Available
        C-->>W: Use Cached Version
    else Load Fresh Deps
        W->>R1: Load Dependencies
        R1-->>C: Cache Dependencies
    end
    
    W->>S: MF Module Ready
    S->>R1: Initialize MF
    R1-->>S: MF Loaded
    
    S->>M: Request Second MF
    M->>R2: Load Remote Bundle
    R2->>C: Use Shared Dependencies
    C-->>R2: Shared React Instance
    R2-->>S: MF Ready
```

## 8. Authentication and Security Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant J as JWT Token
    participant B as Backend API
    participant D as Database

    Note over U,D: Authentication and Security Pipeline
    
    U->>F: Login Request
    F->>A: Authenticate User
    A->>D: Validate Credentials
    D-->>A: User Verified
    
    A->>J: Generate JWT Token
    J->>J: Sign with Secret
    J-->>A: Signed Token
    A-->>F: Return Token
    
    F->>F: Store Token (Secure)
    F-->>U: Login Success
    
    U->>F: API Request
    F->>F: Add Auth Header
    F->>B: Request + JWT
    
    B->>J: Verify Token
    J->>J: Validate Signature
    J->>J: Check Expiration
    
    alt Token Valid
        J-->>B: Token Verified
        B->>D: Execute Request
        D-->>B: Data Response
        B-->>F: Authorized Response
        F-->>U: Success
    else Token Invalid
        J-->>B: Token Rejected
        B-->>F: 401 Unauthorized
        F->>A: Refresh Token
        A-->>F: New Token
        F->>F: Retry Request
    end
```

## 9. Performance Monitoring Flow

```mermaid
sequenceDiagram
    participant C as Component
    participant P as Performance Hook
    participant M as Metrics Collector
    participant S as Storage
    participant A as Analytics
    participant D as Dashboard

    Note over C,D: Performance Monitoring Pipeline
    
    C->>P: Component Mount
    P->>P: Start Performance Timer
    P->>M: Initialize Metrics
    
    C->>C: Render Process
    C->>P: Render Complete
    P->>P: Calculate Render Time
    P->>M: Collect Metrics
    
    M->>M: Memory Usage
    M->>M: FPS Calculation
    M->>M: Bundle Size
    M->>M: Load Time
    
    M->>S: Store Metrics
    S->>S: Aggregate Data
    S->>A: Send to Analytics
    
    A->>A: Process Metrics
    A->>D: Update Dashboard
    D-->>C: Performance Insights
    
    Note over P: Continuous Monitoring
    P->>P: Monitor Every Render
    P->>M: Real-time Metrics
```

## 10. CI/CD Deployment Pipeline

```mermaid
sequenceDiagram
    participant D as Developer
    participant G as Git Repository
    participant CI as CI/CD Pipeline
    participant B as Build Process
    participant T as Tests
    participant A as Azure
    participant CDN as CDN/Static
    participant S as Server

    Note over D,S: Deployment Pipeline Flow
    
    D->>G: Push Code
    G->>CI: Trigger Pipeline
    CI->>B: Start Build
    
    B->>B: Frontend Build
    B->>B: Backend Build
    B->>T: Run Tests
    
    T->>T: Unit Tests
    T->>T: Integration Tests
    T->>T: E2E Tests
    
    alt Tests Pass
        T-->>CI: Tests Successful
        CI->>A: Deploy to Azure
        
        par Frontend Deployment
            A->>CDN: Deploy Static Assets
            CDN-->>A: Deployment Complete
        and Backend Deployment
            A->>S: Deploy Server Components
            S-->>A: Deployment Complete
        end
        
        A-->>CI: Deployment Successful
        CI-->>D: Deployment Complete
    else Tests Fail
        T-->>CI: Tests Failed
        CI-->>D: Build Failed
    end
```

## Diagram Usage

These sequence diagrams illustrate:

1. **Monolithic vs Micro-Frontend** comparison
2. **State Management** patterns and interactions
3. **Virtual DOM** optimization strategies
4. **Navigation** and smart prefetching
5. **Error Handling** and fault isolation
6. **Module Federation** runtime behavior
7. **Authentication** security flow
8. **Performance Monitoring** collection
9. **CI/CD Pipeline** deployment process

Each diagram shows the complete flow from user interaction through to system response, helping understand the architecture decisions and implementation patterns used in this Golden Path template.
