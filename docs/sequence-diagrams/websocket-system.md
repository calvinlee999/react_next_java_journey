# WebSocket Real-Time Communication Sequence Diagrams

This document provides detailed sequence diagrams for the WebSocket implementation in the React + Java + Azure application, demonstrating real-time communication patterns.

## 🔄 WebSocket Connection Establishment

```mermaid
sequenceDiagram
    participant Client as React Client
    participant WSHook as useWebSocket Hook
    participant WSClient as WebSocket Client
    participant API as Next.js API Route
    participant Server as WebSocket Server
    participant Redis as Redis Cache

    Note over Client,Redis: WebSocket Connection Establishment

    Client->>WSHook: Initialize WebSocket connection
    WSHook->>WSClient: new WebSocketClient(config)
    WSClient->>WSClient: Check WebSocket support
    
    alt WebSocket Supported
        WSClient->>API: WebSocket Upgrade Request
        API->>Server: Upgrade HTTP to WebSocket
        Server->>Redis: Store connection metadata
        Server-->>API: WebSocket connection established
        API-->>WSClient: Connection confirmed
        WSClient-->>WSHook: onConnect callback
        WSHook-->>Client: Connection status: 'connected'
        
        Note over WSClient,Server: Start heartbeat mechanism
        loop Every 30 seconds
            WSClient->>Server: ping
            Server-->>WSClient: pong
        end
        
    else WebSocket Not Supported
        WSClient->>WSClient: Fall back to HTTP polling
        WSClient->>API: POST /api/websocket (polling)
        API->>Redis: Store polling connection
        API-->>WSClient: Polling response
        WSClient-->>WSHook: onConnect callback (fallback)
        WSHook-->>Client: Connection status: 'fallback'
        
        loop Every 5 seconds
            WSClient->>API: GET /api/websocket (poll for messages)
            API->>Redis: Check for new messages
            Redis-->>API: Message data
            API-->>WSClient: Messages response
            WSClient-->>WSHook: Process messages
        end
    end
```

## 💬 Real-Time Chat Communication

```mermaid
sequenceDiagram
    participant User1 as User 1 (Browser A)
    participant User2 as User 2 (Browser B)
    participant Hook1 as useChat Hook A
    participant Hook2 as useChat Hook B
    participant Server as WebSocket Server
    participant Redis as Redis Cache

    Note over User1,Redis: Real-Time Chat Flow

    User1->>Hook1: Type message "Hello!"
    Hook1->>Hook1: Start typing indicator
    Hook1->>Server: typing.start event
    Server->>Redis: Store typing state
    Server->>User2: Broadcast typing.start
    Hook2->>User2: Display "User 1 is typing..."

    User1->>Hook1: Send message "Hello!"
    Hook1->>Hook1: Stop typing indicator
    Hook1->>Server: chat.message event
    Server->>Redis: Store message + history
    Server->>Server: Generate message ID + timestamp
    
    par Broadcast to all users
        Server->>Hook1: Message confirmation
        Hook1->>User1: Update UI (sent status)
    and
        Server->>Hook2: New message event
        Hook2->>User2: Display new message
    end

    Note over User1,Redis: Typing Indicator Timeout
    User2->>Hook2: Type response
    Hook2->>Server: typing.start event
    Server->>User1: Broadcast typing indicator
    
    Note over Hook2,Server: Auto-stop typing after 3 seconds
    Hook2->>Hook2: Typing timeout
    Hook2->>Server: typing.stop event
    Server->>User1: Broadcast typing.stop
```

## 🎮 Real-Time Gaming (Tic-Tac-Toe)

```mermaid
sequenceDiagram
    participant Player1 as Player 1
    participant Player2 as Player 2
    participant Game1 as Game Component A
    participant Game2 as Game Component B
    participant Server as WebSocket Server
    participant Redis as Game State Cache

    Note over Player1,Redis: Real-Time Game Flow

    Player1->>Game1: Start new game
    Game1->>Server: game.new event
    Server->>Redis: Create game state
    Server->>Redis: Set game ID: game-12345
    
    par Notify all players
        Server->>Game1: game.created event
        Game1->>Player1: Display game board
    and
        Server->>Game2: game.created event  
        Game2->>Player2: Display game board
    end

    Player1->>Game1: Click cell [0,0]
    Game1->>Game1: Validate move (empty cell, correct turn)
    Game1->>Server: game.move {row: 0, col: 0, player: 'X'}
    
    Server->>Redis: Update game state
    Redis->>Server: Updated board + turn
    Server->>Server: Check for winner
    
    par Broadcast move result
        Server->>Game1: game.move confirmation
        Game1->>Player1: Update local game state
    and
        Server->>Game2: game.move event
        Game2->>Player2: Update game board
        Game2->>Player2: Show "Your turn" indicator
    end

    Player2->>Game2: Click cell [1,1]
    Game2->>Server: game.move {row: 1, col: 1, player: 'O'}
    Server->>Redis: Update game state
    Server->>Server: Check for winner (none yet)
    
    par Continue game
        Server->>Game2: Move confirmed
    and
        Server->>Game1: Opponent move
        Game1->>Player1: Update board + turn indicator
    end

    Note over Player1,Redis: Game continues until win/draw
    Player1->>Game1: Make winning move
    Game1->>Server: game.move (winning move)
    Server->>Redis: Update state + set winner
    
    par Game Over
        Server->>Game1: game.winner event
        Game1->>Player1: Display "You Win!"
    and
        Server->>Game2: game.winner event
        Game2->>Player2: Display "You Lose!"
    end
```

## 📝 Collaborative Document Editing

```mermaid
sequenceDiagram
    participant User1 as Editor 1
    participant User2 as Editor 2
    participant Doc1 as Document Component A
    participant Doc2 as Document Component B
    participant Server as WebSocket Server
    participant Redis as Document Cache

    Note over User1,Redis: Collaborative Editing Flow

    User1->>Doc1: Open document
    Doc1->>Server: document.join event
    Server->>Redis: Add user to document
    Server->>Doc2: document.user_joined event
    Doc2->>User2: Show "User 1 joined"

    User1->>Doc1: Type "Hello World"
    Doc1->>Doc1: Update local state immediately
    Doc1->>Server: document.edit {type: 'insert', position: 0, content: 'Hello World'}
    
    Server->>Redis: Apply operation to document
    Redis->>Server: Updated document state
    Server->>Doc2: document.edit event
    Doc2->>Doc2: Apply remote operation
    Doc2->>User2: Update document content

    User2->>Doc2: Type " - Great!" at end
    Doc2->>Doc2: Update local state
    Doc2->>Server: document.edit {type: 'insert', position: 11, content: ' - Great!'}
    
    Server->>Redis: Apply operation
    Redis->>Server: Updated document
    Server->>Doc1: document.edit event
    Doc1->>User1: Show updated content

    Note over User1,Redis: Conflict Resolution
    par Simultaneous edits
        User1->>Doc1: Edit position 5
        Doc1->>Server: document.edit (position 5)
    and
        User2->>Doc2: Edit position 7  
        Doc2->>Server: document.edit (position 7)
    end
    
    Server->>Redis: Apply operations in order
    Redis->>Server: Resolved document state
    
    par Sync resolution
        Server->>Doc1: document.sync event
        Doc1->>User1: Update with resolved state
    and
        Server->>Doc2: document.sync event
        Doc2->>User2: Update with resolved state
    end
```

## 🔔 Push Notification Broadcasting

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant User1 as User 1
    participant User2 as User 2
    participant AdminUI as Admin Interface
    participant UI1 as User Interface 1
    participant UI2 as User Interface 2
    participant Server as WebSocket Server
    participant Redis as Notification Cache

    Note over Admin,Redis: Push Notification Flow

    Admin->>AdminUI: Create notification
    AdminUI->>AdminUI: Validate notification data
    AdminUI->>Server: notification.broadcast event
    
    Server->>Redis: Store notification + timestamp
    Redis->>Server: Notification ID generated
    Server->>Redis: Get all active connections
    Redis->>Server: List of connected users
    
    par Broadcast to all users
        Server->>AdminUI: notification.sent confirmation
        AdminUI->>Admin: Show "Notification sent"
    and
        Server->>UI1: notification.broadcast event
        UI1->>UI1: Display notification popup
        UI1->>User1: Show notification banner
    and
        Server->>UI2: notification.broadcast event
        UI2->>UI2: Display notification popup
        UI2->>User2: Show notification banner
    end

    Note over User1,Redis: User Interaction
    User1->>UI1: Click notification
    UI1->>Server: notification.read event
    Server->>Redis: Mark as read for user
    
    User2->>UI2: Dismiss notification
    UI2->>Server: notification.dismiss event
    Server->>Redis: Mark as dismissed for user

    Note over Admin,Redis: Notification Analytics
    Admin->>AdminUI: Request notification stats
    AdminUI->>Server: notification.stats request
    Server->>Redis: Query notification metrics
    Redis->>Server: Delivery/read/dismiss rates
    Server->>AdminUI: Statistics response
    AdminUI->>Admin: Display analytics dashboard
```

## 🔄 Connection Recovery & Resilience

```mermaid
sequenceDiagram
    participant Client as React Client
    participant WSClient as WebSocket Client
    participant Server as WebSocket Server
    participant Redis as Redis Cache

    Note over Client,Redis: Connection Recovery Flow

    Client->>WSClient: Active WebSocket connection
    WSClient->>Server: Normal message flow
    
    Note over Server: Network interruption occurs
    Server--xWSClient: Connection lost
    WSClient->>WSClient: Detect connection loss
    WSClient->>Client: Connection status: 'disconnected'
    
    Note over WSClient: Automatic reconnection logic
    WSClient->>WSClient: Start exponential backoff
    
    loop Reconnection attempts
        WSClient->>WSClient: Wait (1s, 2s, 4s, 8s...)
        WSClient->>Server: Attempt reconnection
        
        alt Reconnection successful
            Server->>Redis: Restore connection metadata
            Server-->>WSClient: Connection restored
            WSClient->>Client: Connection status: 'connected'
            
            Note over WSClient,Redis: Sync missed messages
            WSClient->>Server: Request missed messages
            Server->>Redis: Query message history
            Redis-->>Server: Missed messages
            Server-->>WSClient: Message backlog
            WSClient->>Client: Update UI with missed content
            
        else Reconnection failed
            Server--xWSClient: Still unavailable
            WSClient->>WSClient: Continue backoff
            
            alt Max retries reached
                WSClient->>WSClient: Switch to HTTP fallback
                WSClient->>Server: POST /api/websocket (polling mode)
                Server->>Redis: Register polling connection
                WSClient->>Client: Connection status: 'fallback'
                
                loop Polling mode
                    WSClient->>Server: GET /api/websocket
                    Server->>Redis: Check for messages
                    Redis-->>Server: Message data
                    Server-->>WSClient: Polling response
                end
            end
        end
    end

    Note over Client,Redis: Graceful degradation maintained
    Client->>WSClient: Continue using application
    WSClient->>Server: Send messages via fallback
    Server->>Redis: Process messages normally
```

## 📊 Performance Monitoring & Metrics

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Monitor as Performance Monitor
    participant AppInsights as Application Insights
    participant Server as WebSocket Server
    participant Analytics as Analytics Service

    Note over Client,Analytics: Performance Monitoring Flow

    Client->>Monitor: WebSocket connection established
    Monitor->>AppInsights: Log connection event
    Monitor->>Monitor: Start performance tracking
    
    loop Message exchange
        Client->>Server: Send message
        Monitor->>Monitor: Record message latency
        Server-->>Client: Receive response
        Monitor->>Monitor: Calculate round-trip time
        
        Monitor->>AppInsights: Custom metric: message_latency
        Monitor->>AppInsights: Custom metric: connection_quality
    end

    Note over Monitor,Analytics: Connection Quality Assessment
    Monitor->>Monitor: Analyze connection patterns
    
    alt Poor connection detected
        Monitor->>Client: Suggest fallback mode
        Monitor->>AppInsights: Log performance degradation
    else Good connection
        Monitor->>AppInsights: Log stable performance
    end

    Note over Client,Analytics: Periodic Reporting
    Monitor->>Analytics: Aggregate performance data
    Analytics->>AppInsights: Store aggregated metrics
    
    par Real-time dashboards
        AppInsights->>Analytics: Query recent metrics
        Analytics-->>AppInsights: Performance dashboard data
    and
        Analytics->>Analytics: Generate performance alerts
        Analytics->>AppInsights: Alert on anomalies
    end
```

---

## 🎯 Key Implementation Benefits

### Real-Time Performance
- **Sub-second message delivery**: Optimized WebSocket implementation
- **Automatic failover**: Seamless fallback to HTTP polling
- **Connection pooling**: Efficient resource management

### Scalability Features
- **Redis clustering**: Horizontal scaling for connection state
- **Load balancing**: Multiple WebSocket server instances
- **Message queuing**: Reliable delivery guarantees

### Developer Experience
- **Type-safe hooks**: Full TypeScript integration
- **Error boundaries**: Graceful error handling
- **Hot reloading**: Development-friendly implementation

### Enterprise Features
- **Connection monitoring**: Real-time health checks
- **Performance metrics**: Application Insights integration
- **Security**: Message validation and rate limiting

This WebSocket implementation provides enterprise-grade real-time communication with comprehensive fallback strategies and monitoring capabilities.