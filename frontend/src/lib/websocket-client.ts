/**
 * WebSocket Client Library for React/Next.js
 * Provides full-duplex real-time communication with automatic reconnection and fallback to HTTP polling
 */

export interface WebSocketMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  from?: string;
  to?: string;
}

export interface WebSocketConnection {
  id: string;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

export interface WebSocketClientOptions {
  url?: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  fallbackToHttp?: boolean;
  httpFallbackInterval?: number;
  debug?: boolean;
}

export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

type WebSocketEventHandler = (event: WebSocketEvent) => void;
type WebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback') => void;

/**
 * WebSocket Client with automatic reconnection and HTTP fallback
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private connectionId: string;
  private options: Required<WebSocketClientOptions>;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private statusHandlers: WebSocketStatusHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private fallbackTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;
  private status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback' = 'disconnected';
  private lastMessageId: string | null = null;
  private httpFallbackActive = false;

  constructor(options: WebSocketClientOptions = {}) {
    this.connectionId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const defaultUrl = typeof window !== 'undefined' ? 
      `${protocol}//${window.location.host}/ws` : 
      'ws://localhost:3000/ws';
    
    this.options = {
      url: options.url || defaultUrl,
      protocols: options.protocols || [],
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      heartbeatInterval: options.heartbeatInterval || 30000,
      fallbackToHttp: options.fallbackToHttp ?? true,
      httpFallbackInterval: options.httpFallbackInterval || 2000,
      debug: options.debug ?? false
    };

    this.log('WebSocket client initialized', { connectionId: this.connectionId });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;
      this.setStatus('connecting');
      this.log('Attempting to connect...');

      try {
        this.ws = new WebSocket(this.options.url, this.options.protocols);

        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.httpFallbackActive = false;
          this.stopFallback();
          this.startHeartbeat();
          
          // Send initial connection message
          this.sendMessage('connection.establish', {
            connectionId: this.connectionId,
            timestamp: Date.now(),
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Node.js'
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.log('Failed to parse message', error);
          }
        };

        this.ws.onclose = (event) => {
          this.log('WebSocket closed', { code: event.code, reason: event.reason });
          this.stopHeartbeat();
          
          if (!this.isManualClose) {
            this.setStatus('disconnected');
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (event) => {
          this.log('WebSocket error', event);
          this.setStatus('error');
          
          if (this.options.fallbackToHttp) {
            this.startHttpFallback();
          }
          
          reject(new Error('WebSocket connection failed'));
        };

        // Timeout for connection attempt
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.log('Connection timeout, falling back to HTTP polling');
            if (this.options.fallbackToHttp) {
              this.startHttpFallback();
              resolve(); // Resolve with fallback
            } else {
              reject(new Error('Connection timeout'));
            }
          }
        }, 10000);

      } catch (error) {
        this.log('Failed to create WebSocket', error);
        this.setStatus('error');
        
        if (this.options.fallbackToHttp) {
          this.startHttpFallback();
          resolve(); // Resolve with fallback
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopReconnect();
    this.stopHeartbeat();
    this.stopFallback();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    // Notify server about disconnection via HTTP
    if (typeof fetch !== 'undefined') {
      fetch(`/api/websocket?connectionId=${this.connectionId}`, {
        method: 'DELETE'
      }).catch(() => {
        // Ignore errors on disconnect
      });
    }

    this.setStatus('disconnected');
    this.log('Disconnected');
  }

  /**
   * Send message through WebSocket or HTTP fallback
   */
  sendMessage(type: string, data: unknown, to?: string): Promise<boolean> {
    const message: Omit<WebSocketMessage, 'id' | 'timestamp'> = {
      type,
      data,
      from: this.connectionId,
      to
    };

    // Try WebSocket first
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }));
        this.log('Message sent via WebSocket', { type, to });
        return Promise.resolve(true);
      } catch (error) {
        this.log('Failed to send via WebSocket', error);
      }
    }

    // Fallback to HTTP
    if (this.options.fallbackToHttp && typeof fetch !== 'undefined') {
      return fetch('/api/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...message,
          connectionId: this.connectionId
        })
      })
      .then(response => {
        if (response.ok) {
          this.log('Message sent via HTTP fallback', { type, to });
          return true;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      })
      .catch(error => {
        this.log('Failed to send via HTTP fallback', error);
        return false;
      });
    }

    return Promise.resolve(false);
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback' {
    return this.status;
  }

  /**
   * Get connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Check if connected (WebSocket or HTTP fallback)
   */
  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'fallback';
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    this.log('Message received', { type: message.type, from: message.from });

    // Update last message ID for HTTP fallback
    this.lastMessageId = message.id;

    // Emit to event handlers
    const handlers = this.eventHandlers.get(message.type) || [];
    const allHandlers = this.eventHandlers.get('*') || [];

    [...handlers, ...allHandlers].forEach(handler => {
      try {
        handler({
          type: message.type,
          data: message.data,
          timestamp: message.timestamp
        });
      } catch (error) {
        this.log('Error in event handler', error);
      }
    });
  }

  /**
   * Set connection status and notify handlers
   */
  private setStatus(status: typeof this.status): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          this.log('Error in status handler', error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.isManualClose || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached or manual close');
      
      if (this.options.fallbackToHttp) {
        this.startHttpFallback();
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, delay);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage('heartbeat', { timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Start HTTP polling fallback
   */
  private startHttpFallback(): void {
    if (!this.options.fallbackToHttp || this.httpFallbackActive) {
      return;
    }

    this.httpFallbackActive = true;
    this.setStatus('fallback');
    this.log('Starting HTTP fallback polling');

    const poll = async () => {
      if (!this.httpFallbackActive || this.isManualClose) {
        return;
      }

      try {
        const params = new URLSearchParams({
          connectionId: this.connectionId,
          limit: '10'
        });

        if (this.lastMessageId) {
          params.append('lastMessageId', this.lastMessageId);
        }

        const response = await fetch(`/api/websocket?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Process new messages
          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach((message: WebSocketMessage) => {
              this.handleMessage(message);
            });
          }
        }
      } catch (error) {
        this.log('HTTP fallback polling error', error);
      }

      // Schedule next poll
      if (this.httpFallbackActive) {
        this.fallbackTimer = setTimeout(poll, this.options.httpFallbackInterval);
      }
    };

    // Start polling
    poll();
  }

  /**
   * Stop HTTP fallback polling
   */
  private stopFallback(): void {
    this.httpFallbackActive = false;
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: unknown): void {
    if (this.options.debug) {
      console.log(`[WebSocket:${this.connectionId.slice(-8)}] ${message}`, data || '');
    }
  }
}

/**
 * Create a WebSocket client instance
 */
export function createWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  return new WebSocketClient(options);
}

export default WebSocketClient;