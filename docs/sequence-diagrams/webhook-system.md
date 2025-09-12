# Webhook System Sequence Diagrams

## 1. Webhook Reception and Processing

```mermaid
sequenceDiagram
    participant ES as External Service
    participant API as Webhook API
    participant Store as In-Memory Store
    participant UI as Webhook UI
    
    ES->>API: POST /api/webhooks?source=github&event=push
    Note over ES,API: Headers: Content-Type, X-Webhook-Signature
    
    API->>API: Validate Request
    API->>API: Verify Signature
    API->>API: Parse Event Data
    
    alt Valid Webhook
        API->>Store: Store Webhook Event
        Store-->>API: Event Stored
        API-->>ES: 200 OK + Processing Result
    else Invalid Webhook
        API-->>ES: 400 Bad Request
    end
    
    Note over UI: Auto-refresh every 5s
    UI->>API: GET /api/webhooks?limit=50
    API->>Store: Retrieve Events
    Store-->>API: Event List
    API-->>UI: Events + Statistics
    UI->>UI: Update Display
```

## 2. Interactive Webhook Testing

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Webhook UI
    participant API as Webhook API
    participant Store as In-Memory Store
    
    User->>UI: Select Quick Example
    UI->>UI: Populate Test Form
    User->>UI: Click "Send Test Webhook"
    
    UI->>API: POST /api/webhooks?source=demo&event=user.created
    Note over UI,API: Headers: Content-Type, X-Webhook-Signature
    
    API->>API: Process Webhook
    API->>Store: Store Test Event
    Store-->>API: Event Stored
    API-->>UI: 200 OK + Result
    
    UI->>UI: Show Success Message
    Note over UI: Auto-refresh triggers
    UI->>API: GET /api/webhooks?limit=50
    API-->>UI: Updated Event List
    UI->>UI: Display New Test Event
```

## 3. Real-time Event Monitoring

```mermaid
sequenceDiagram
    participant Timer as Auto-Refresh Timer
    participant UI as Webhook UI
    participant API as Webhook API
    participant Store as In-Memory Store
    participant User as User
    
    Timer->>UI: Trigger Refresh (5s interval)
    UI->>API: GET /api/webhooks?limit=50
    API->>Store: Query Events
    Store-->>API: Event List + Stats
    API-->>UI: Events + Statistics
    
    UI->>UI: Update Event List
    UI->>UI: Update Statistics Cards
    UI->>UI: Apply Filters (if any)
    
    alt New Events Available
        UI->>UI: Highlight New Events
        Note over User: User sees real-time updates
    end
    
    User->>UI: Click "View Details"
    UI->>UI: Expand Event Details
    UI->>UI: Show Headers + Payload
```

## 4. Webhook Event Filtering and Management

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Webhook UI
    participant API as Webhook API
    participant Store as In-Memory Store
    
    User->>UI: Select Source Filter
    UI->>API: GET /api/webhooks?limit=50&source=github
    API->>Store: Query Filtered Events
    Store-->>API: Filtered Event List
    API-->>UI: Filtered Results
    UI->>UI: Update Display
    
    User->>UI: Click "Clear All Events"
    UI->>API: DELETE /api/webhooks
    API->>Store: Clear All Events
    Store-->>API: Events Cleared
    API-->>UI: 200 OK
    UI->>UI: Clear Event Display
    UI->>UI: Reset Statistics
```

## 5. Multi-Service Webhook Integration

```mermaid
sequenceDiagram
    participant GitHub as GitHub
    participant Stripe as Stripe
    participant Custom as Custom Service
    participant API as Webhook API
    participant Store as In-Memory Store
    participant UI as Webhook UI
    
    par GitHub Webhook
        GitHub->>API: POST /api/webhooks?source=github&event=repository.push
        API->>Store: Store GitHub Event
    and Stripe Webhook
        Stripe->>API: POST /api/webhooks?source=stripe&event=payment.succeeded
        API->>Store: Store Stripe Event
    and Custom Service Webhook
        Custom->>API: POST /api/webhooks?source=auth-service&event=user.created
        API->>Store: Store Custom Event
    end
    
    Note over UI: Next auto-refresh cycle
    UI->>API: GET /api/webhooks?limit=50
    API->>Store: Retrieve All Events
    Store-->>API: Mixed Event List
    API-->>UI: Events from Multiple Sources
    
    UI->>UI: Group by Source
    UI->>UI: Show Event Type Variety
    UI->>UI: Update Statistics Dashboard
```

## 6. Error Handling and Recovery

```mermaid
sequenceDiagram
    participant ES as External Service
    participant API as Webhook API
    participant Store as In-Memory Store
    participant UI as Webhook UI
    
    ES->>API: POST /api/webhooks (Invalid JSON)
    API->>API: Parse Request Body
    API-->>ES: 400 Bad Request + Error Details
    
    ES->>API: POST /api/webhooks (Invalid Signature)
    API->>API: Verify Signature
    API-->>ES: 401 Unauthorized
    
    ES->>API: POST /api/webhooks (Missing Source)
    API->>API: Validate Query Parameters
    API-->>ES: 400 Bad Request + Validation Error
    
    UI->>API: GET /api/webhooks (Server Error)
    API-->>UI: 500 Internal Server Error
    UI->>UI: Show Error State
    UI->>UI: Retry After Delay
    
    Note over UI: Error Recovery
    UI->>API: GET /api/webhooks (Retry)
    API-->>UI: 200 OK + Events
    UI->>UI: Restore Normal State
```

## Key Features Demonstrated

### Event-Driven Architecture
- Asynchronous webhook processing
- Real-time event monitoring
- Multi-source event aggregation

### Security & Validation
- Signature verification
- Request validation
- Error handling and recovery

### User Experience
- Auto-refreshing interface
- Interactive testing tools
- Detailed event inspection
- Filtering and management

### Scalability Patterns
- Stateless API design
- Efficient event storage
- Pagination support
- Source-based filtering

These diagrams illustrate how the webhook system handles real-time event-driven communication, providing both educational value and practical functionality for modern web applications.
