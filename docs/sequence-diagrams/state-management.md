# State Management Sequence Diagrams

## 1. Zustand Store Integration

```mermaid
sequenceDiagram
    participant User as User
    participant Component as React Component
    participant Store as Zustand Store
    participant Persist as Persist Middleware
    participant Storage as localStorage
    
    Note over User,Storage: Application Initialization
    
    Component->>Store: useThemeStore()
    Store->>Persist: Initialize with Persistence
    Persist->>Storage: Load Saved State
    Storage-->>Persist: Previous Theme Settings
    Persist-->>Store: Restore State
    Store-->>Component: Current Theme State
    
    User->>Component: Toggle Dark Mode
    Component->>Store: toggleTheme()
    Store->>Store: Update Theme State
    Store->>Persist: Trigger Persistence
    Persist->>Storage: Save New State
    Store->>Component: Notify State Change
    Component->>Component: Re-render with New Theme
    
    Note over Component: All subscribed components update automatically
```

## 2. Navigation State Management

```mermaid
sequenceDiagram
    participant User as User
    participant NavComponent as Navigation Component
    participant NavStore as Navigation Store
    participant Router as Next.js Router
    participant HistoryStore as History Store
    
    User->>NavComponent: Click Navigation Link
    NavComponent->>NavStore: setCurrentRoute(newRoute)
    NavStore->>NavStore: Update Current Route
    NavStore->>HistoryStore: addToHistory(route)
    
    NavStore->>Router: router.push(newRoute)
    Router->>Router: Navigate to New Page
    Router-->>NavComponent: Route Change Complete
    
    NavComponent->>NavStore: setLoadingState(false)
    NavStore->>NavStore: Update Loading State
    
    Note over NavComponent: Navigation state synchronized across app
    
    NavStore->>NavComponent: Notify All Subscribers
    NavComponent->>NavComponent: Update Active States
    NavComponent->>NavComponent: Hide Loading Indicators
```

## 3. Real-time Data Synchronization

```mermaid
sequenceDiagram
    participant User as User
    participant ListComponent as User List Component
    participant DetailComponent as User Detail Component
    participant UserStore as User Store
    participant API as Backend API
    participant Cache as Cache Layer
    
    User->>ListComponent: View User List
    ListComponent->>UserStore: getUsers()
    UserStore->>API: Fetch Users
    API-->>UserStore: Users Data
    UserStore->>Cache: Cache Users
    UserStore-->>ListComponent: Return Users
    ListComponent->>ListComponent: Render User List
    
    User->>DetailComponent: Edit User
    DetailComponent->>UserStore: updateUser(userId, changes)
    UserStore->>API: PUT /api/users/{id}
    API-->>UserStore: Updated User
    
    UserStore->>UserStore: Update Local State
    UserStore->>Cache: Update Cached User
    
    par Notify All Subscribers
        UserStore-->>ListComponent: User Updated
        and
        UserStore-->>DetailComponent: Update Confirmed
    end
    
    ListComponent->>ListComponent: Re-render Updated User
    DetailComponent->>DetailComponent: Show Success State
```

## 4. Global Loading and Error States

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Any Component
    participant LoadingStore as Loading Store
    participant ErrorStore as Error Store
    participant API as API Client
    participant UIOverlay as UI Overlay
    
    User->>Component: Trigger Data Request
    Component->>LoadingStore: setLoading(true, 'users')
    LoadingStore-->>UIOverlay: Show Loading Spinner
    
    Component->>API: Fetch Data
    
    alt Successful Request
        API-->>Component: Data Response
        Component->>LoadingStore: setLoading(false, 'users')
        LoadingStore-->>UIOverlay: Hide Loading Spinner
        Component->>Component: Render Data
    else Failed Request
        API-->>Component: Error Response
        Component->>LoadingStore: setLoading(false, 'users')
        Component->>ErrorStore: setError('users', errorMessage)
        ErrorStore-->>UIOverlay: Show Error Toast
        LoadingStore-->>UIOverlay: Hide Loading Spinner
    end
    
    Note over User: User sees appropriate feedback
    
    User->>UIOverlay: Dismiss Error Toast
    UIOverlay->>ErrorStore: clearError('users')
    ErrorStore->>ErrorStore: Remove Error State
```

## 5. Optimistic Updates Pattern

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Component
    participant Store as Data Store
    participant API as Backend API
    participant ErrorHandler as Error Handler
    
    User->>Component: Submit Form (Create User)
    Component->>Store: optimisticCreate(newUser)
    
    Note over Store: Immediately add user to local state
    Store->>Store: Add Temporary User (optimistic: true)
    Store-->>Component: Updated State with New User
    Component->>Component: Show New User Immediately
    
    Store->>API: POST /api/users (background)
    
    alt API Success
        API-->>Store: Created User with Real ID
        Store->>Store: Replace Temporary User with Real User
        Store->>Store: Mark as optimistic: false
        Store-->>Component: Confirm User Creation
    else API Failure
        API-->>Store: Error Response
        Store->>Store: Remove Temporary User
        Store->>ErrorHandler: Handle Creation Error
        ErrorHandler-->>Component: Show Error Message
        Component->>Component: Revert UI State
    end
```

## 6. Cross-Component State Synchronization

```mermade
sequenceDiagram
    participant HeaderComponent as Header Component
    participant SidebarComponent as Sidebar Component
    participant MainComponent as Main Component
    participant SharedStore as Shared Store
    participant ThemeStore as Theme Store
    
    Note over HeaderComponent,ThemeStore: Multiple components sharing state
    
    HeaderComponent->>ThemeStore: Subscribe to theme changes
    SidebarComponent->>ThemeStore: Subscribe to theme changes
    MainComponent->>ThemeStore: Subscribe to theme changes
    
    HeaderComponent->>SharedStore: Subscribe to user state
    SidebarComponent->>SharedStore: Subscribe to navigation state
    MainComponent->>SharedStore: Subscribe to data state
    
    Note over HeaderComponent: User changes theme in header
    HeaderComponent->>ThemeStore: setTheme('dark')
    ThemeStore->>ThemeStore: Update Theme State
    
    par Notify All Theme Subscribers
        ThemeStore-->>HeaderComponent: Theme Updated
        and
        ThemeStore-->>SidebarComponent: Theme Updated
        and
        ThemeStore-->>MainComponent: Theme Updated
    end
    
    HeaderComponent->>HeaderComponent: Update Header Styling
    SidebarComponent->>SidebarComponent: Update Sidebar Styling
    MainComponent->>MainComponent: Update Main Content Styling
    
    Note over HeaderComponent,MainComponent: All components stay synchronized
```

## 7. Middleware Chain Processing

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Store as Zustand Store
    participant Logger as Logger Middleware
    participant Persist as Persist Middleware
    participant DevTools as DevTools Middleware
    participant Storage as Browser Storage
    
    Component->>Store: dispatch(action)
    Store->>Logger: Process Action
    Logger->>Logger: Log Action Details
    Logger->>Persist: Pass to Next Middleware
    
    Persist->>Persist: Check if Persistable
    alt Should Persist
        Persist->>Storage: Save to localStorage
        Storage-->>Persist: Confirm Save
    end
    
    Persist->>DevTools: Pass to Next Middleware
    DevTools->>DevTools: Send to Browser DevTools
    DevTools->>Store: Execute Action
    
    Store->>Store: Update State
    Store-->>Component: Notify State Change
    
    Note over Logger: Complete middleware chain
    Logger->>Logger: Log State Update
    DevTools->>DevTools: Update DevTools Display
```

## Key State Management Features

### Zustand Benefits

- **Minimal Boilerplate**: Simple store creation and usage
- **TypeScript Support**: Full type safety throughout
- **Middleware Support**: Extensible with plugins
- **Performance**: Selective subscriptions prevent unnecessary re-renders

### State Patterns

- **Global State**: Shared across all components
- **Local State**: Component-specific state
- **Derived State**: Computed values from base state
- **Optimistic Updates**: Immediate UI feedback

### Persistence

- **Auto-persistence**: Automatic state saving
- **Selective Persistence**: Choose what to persist
- **Hydration**: Restore state on app load
- **Migration**: Handle state schema changes

### Developer Experience

- **DevTools Integration**: Redux DevTools support
- **Time Travel Debugging**: Replay state changes
- **Action Logging**: Track all state mutations
- **Hot Reloading**: Preserve state during development

These state management patterns enable scalable, maintainable React applications with predictable state updates and excellent developer experience.
