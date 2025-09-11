# Caching System Sequence Diagrams

## 1. Multi-Layer Caching Architecture

```mermaid
sequenceDiagram
    participant User as User
    participant Component as React Component
    participant Hook as usePagination Hook
    participant Client as CachedAPIClient
    participant Memory as Memory Cache
    participant IndexedDB as IndexedDB Cache
    participant SW as Service Worker
    participant API as Backend API
    
    User->>Component: Request Page Data
    Component->>Hook: usePagination(cache-first)
    Hook->>Client: fetchData(url, cache-first)
    
    Client->>Memory: Check Memory Cache
    alt Cache Hit (Memory)
        Memory-->>Client: Cached Data
        Client-->>Hook: Return Cached Data
    else Cache Miss (Memory)
        Client->>IndexedDB: Check IndexedDB Cache
        alt Cache Hit (IndexedDB)
            IndexedDB-->>Client: Cached Data
            Client->>Memory: Store in Memory
            Client-->>Hook: Return Cached Data
        else Cache Miss (IndexedDB)
            Client->>SW: Check Service Worker Cache
            alt Cache Hit (Service Worker)
                SW-->>Client: Cached Data
                Client->>Memory: Store in Memory
                Client->>IndexedDB: Store in IndexedDB
                Client-->>Hook: Return Cached Data
            else Cache Miss (All Layers)
                Client->>API: Fetch Fresh Data
                API-->>Client: Fresh Data
                Client->>Memory: Store in Memory
                Client->>IndexedDB: Store in IndexedDB
                Client->>SW: Store in Service Worker
                Client-->>Hook: Return Fresh Data
            end
        end
    end
    
    Hook-->>Component: Data + Pagination State
    Component->>Component: Render UI
```

## 2. Pagination with Caching Strategies

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Paginated Component
    participant Hook as usePagination Hook
    participant Client as CachedAPIClient
    participant Cache as Cache Layer
    participant API as Backend API
    
    User->>Component: Initial Load
    Component->>Hook: usePagination({strategy: 'cache-first'})
    Hook->>Client: fetchData(page=1, cache-first)
    
    Client->>Cache: Check Cache for Page 1
    alt Cache Hit
        Cache-->>Client: Page 1 Data
        Client-->>Hook: Cached Page 1
    else Cache Miss
        Client->>API: GET /api/users?page=1
        API-->>Client: Page 1 Data
        Client->>Cache: Store Page 1
        Client-->>Hook: Fresh Page 1
    end
    
    Hook-->>Component: Page 1 + hasNextPage: true
    Component->>Component: Render Page 1
    
    User->>Component: Click Next Page
    Component->>Hook: nextPage()
    Hook->>Client: fetchData(page=2, cache-first)
    
    Client->>Cache: Check Cache for Page 2
    alt Cache Hit
        Cache-->>Client: Page 2 Data
    else Cache Miss
        Client->>API: GET /api/users?page=2
        API-->>Client: Page 2 Data
        Client->>Cache: Store Page 2
    end
    
    Client-->>Hook: Page 2 Data
    Hook-->>Component: Page 2 + Navigation State
    Component->>Component: Render Page 2
```

## 3. Cache Invalidation and Refresh

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Component
    participant Hook as usePagination Hook
    parameter Client as CachedAPIClient
    participant Cache as Cache Layer
    participant API as Backend API
    
    Note over User,API: User has cached data from previous session
    
    User->>Component: Load Page (with stale cache)
    Component->>Hook: usePagination({strategy: 'cache-first'})
    Hook->>Client: fetchData(cache-first)
    Client->>Cache: Get Cached Data
    Cache-->>Client: Stale Data (5 minutes old)
    Client-->>Hook: Stale Data
    Hook-->>Component: Show Stale Data Immediately
    
    Note over Component: User sees content instantly
    
    Client->>Client: Check Cache Age
    alt Cache Expired
        Client->>API: Background Refresh
        API-->>Client: Fresh Data
        Client->>Cache: Update Cache
        Client->>Hook: Notify Fresh Data Available
        Hook->>Component: Update with Fresh Data
        Component->>Component: Re-render with Fresh Data
    end
    
    User->>Component: Manual Refresh
    Component->>Hook: refreshData()
    Hook->>Client: fetchData(network-first)
    Client->>API: Force Fresh Fetch
    API-->>Client: Latest Data
    Client->>Cache: Invalidate + Store Fresh
    Client-->>Hook: Fresh Data
    Hook-->>Component: Updated Data
```

## 4. Offline-First Caching with Service Worker

```mermaid
sequenceDiagram
    participant User as User
    participant App as React App
    participant SW as Service Worker
    participant Cache as SW Cache
    participant Network as Network/API
    
    Note over User,Network: User goes offline
    
    User->>App: Request Data
    App->>SW: fetch('/api/users')
    SW->>Network: Try Network First
    Network--xSW: Network Unavailable
    
    SW->>Cache: Check SW Cache
    alt Cache Hit
        Cache-->>SW: Cached Data
        SW-->>App: Serve Cached Data
        App->>App: Show Cached Data + Offline Indicator
    else Cache Miss
        SW-->>App: 504 Gateway Timeout
        App->>App: Show Offline Message
    end
    
    Note over User,Network: Network comes back online
    
    SW->>SW: Detect Online Event
    SW->>Network: Background Sync
    Network-->>SW: Fresh Data
    SW->>Cache: Update Cache
    SW->>App: Notify App of Fresh Data
    App->>App: Update UI + Remove Offline Indicator
```

## 5. Performance Optimization Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Component
    participant Monitor as Performance Monitor
    participant Hook as usePagination
    participant Client as API Client
    participant Cache as Cache System
    
    User->>Component: Navigate to Page
    Component->>Monitor: Start Performance Tracking
    Component->>Hook: Initialize Pagination
    
    Monitor->>Monitor: Measure Initial Render Time
    Hook->>Client: Fetch Data (optimized strategy)
    
    par Cache Strategy Selection
        Client->>Client: Analyze Request Pattern
        alt Frequently Accessed
            Client->>Cache: Use cache-first
        else Real-time Critical
            Client->>Cache: Use network-first
        else Offline Support
            Client->>Cache: Use cache-only + background sync
        end
    end
    
    Client-->>Hook: Return Data
    Hook-->>Component: Provide Data + State
    Component->>Component: Render with Virtual DOM
    
    Monitor->>Monitor: Measure Complete Load Time
    Monitor->>Monitor: Track Cache Hit Ratio
    Monitor->>Monitor: Log Performance Metrics
    
    alt Performance Threshold Exceeded
        Monitor->>Client: Suggest Cache Strategy Adjustment
        Client->>Client: Optimize Cache Configuration
    end
```

## Key Caching Features

### Multi-Layer Cache Architecture

- **Memory Cache**: Fastest access for frequently used data
- **IndexedDB Cache**: Persistent browser storage
- **Service Worker Cache**: Offline support and background sync
- **Strategic Cache Selection**: Different strategies based on use case

### Cache Strategies

- **cache-first**: Prioritize cached data for speed
- **network-first**: Ensure fresh data when needed
- **cache-only**: Full offline support
- **network-only**: Always fetch fresh data

### Performance Benefits

- **Instant Loading**: Cached data displays immediately
- **Reduced API Calls**: Less server load and bandwidth
- **Offline Support**: App works without internet
- **Background Updates**: Fresh data loads silently

### Smart Invalidation

- **Time-based Expiry**: Automatic cache refresh
- **Manual Refresh**: User-triggered updates
- **Event-based Invalidation**: Cache updates on data changes
- **Selective Clearing**: Granular cache management

These caching patterns demonstrate modern web application performance optimization strategies, ensuring fast, reliable user experiences across various network conditions.
