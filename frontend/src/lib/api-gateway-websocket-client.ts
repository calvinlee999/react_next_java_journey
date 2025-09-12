/**
 * Azure API Management Gateway Integration for WebSocket Client
 * Enhanced WebSocket client that routes through Azure API Management Gateway
 */

import { WebSocketClient, WebSocketClientOptions, createWebSocketClient } from './websocket-client';

export interface APIGatewayWebSocketOptions extends WebSocketClientOptions {
  /** Azure API Management Gateway URL */
  gatewayUrl?: string;
  /** API Management subscription key */
  subscriptionKey?: string;
  /** Azure AD access token for authentication */
  accessToken?: string;
  /** API version */
  apiVersion?: string;
  /** Enable Azure API Management specific features */
  useAPIManagement?: boolean;
}

/**
 * Enhanced WebSocket client for Azure API Management Gateway
 * Uses composition to wrap the base WebSocketClient with API Management features
 */
export class APIGatewayWebSocketClient {
  private readonly client: WebSocketClient;
  private readonly gatewayUrl: string;
  private subscriptionKey?: string;
  private accessToken?: string;
  private readonly apiVersion: string;
  private readonly useAPIManagement: boolean;

  constructor(options: APIGatewayWebSocketOptions = {}) {
    // Default Azure API Management WebSocket URL
    const defaultGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_WS_URL || 
                             process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace('https://', 'wss://') + '/ws' ||
                             'wss://localhost:3000/ws';

    this.gatewayUrl = options.gatewayUrl || defaultGatewayUrl;
    this.subscriptionKey = options.subscriptionKey || process.env.NEXT_PUBLIC_APIM_SUBSCRIPTION_KEY;
    this.accessToken = options.accessToken;
    this.apiVersion = options.apiVersion || 'v1';
    this.useAPIManagement = options.useAPIManagement !== false;

    // Build the WebSocket URL with API Management parameters
    const wsUrl = this.buildWebSocketUrl();

    const wsOptions: WebSocketClientOptions = {
      ...options,
      url: wsUrl
    };

    this.client = createWebSocketClient(wsOptions);
  }

  /**
   * Build WebSocket URL with API Management parameters
   */
  private buildWebSocketUrl(): string {
    if (!this.useAPIManagement) {
      return this.gatewayUrl;
    }

    const wsUrl = new URL(this.gatewayUrl);
    
    if (this.apiVersion) {
      wsUrl.searchParams.set('api-version', this.apiVersion);
    }

    if (this.subscriptionKey) {
      wsUrl.searchParams.set('subscription-key', this.subscriptionKey);
    }

    return wsUrl.toString();
  }

  /**
   * Connect to WebSocket through Azure API Management Gateway
   */
  async connect(): Promise<void> {
    console.log(`🔗 Connecting through Azure API Management Gateway: ${this.gatewayUrl}`);
    
    try {
      await this.client.connect();
      
      // Send enhanced connection message with API Management context
      await this.sendMessage('connection.establish', {
        connectionId: this.client.getConnectionId(),
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Node.js',
        gateway: 'azure-api-management',
        apiVersion: this.apiVersion,
        features: ['websocket', 'api-management', 'jwt-auth']
      });
      
      console.log('✅ Connected through Azure API Management Gateway');
    } catch (error) {
      console.error('❌ Failed to connect through API Management Gateway:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.client.disconnect();
  }

  /**
   * Send message through Azure API Management Gateway with enhanced metadata
   */
  async sendMessage(type: string, data: unknown, to?: string): Promise<boolean> {
    const enhancedData = {
      ...(typeof data === 'object' && data !== null ? data : { payload: data }),
      gateway: 'azure-api-management',
      apiVersion: this.apiVersion,
      timestamp: Date.now()
    };

    return this.client.sendMessage(type, enhancedData, to);
  }

  /**
   * Subscribe to events from the WebSocket client
   */
  on(eventType: string, handler: (event: { type: string; data: unknown; timestamp: number }) => void): () => void {
    return this.client.on(eventType, handler);
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: (status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback') => void): () => void {
    return this.client.onStatusChange(handler);
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback' {
    return this.client.getStatus();
  }

  /**
   * Get connection ID
   */
  getConnectionId(): string {
    return this.client.getConnectionId();
  }

  /**
   * Check if connected (WebSocket or HTTP fallback)
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * Set Azure AD access token for authentication
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    // Reconnect with new token if currently connected
    if (this.isConnected()) {
      console.log('🔄 Reconnecting with new access token...');
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
  }

  /**
   * Set API Management subscription key
   */
  setSubscriptionKey(key: string): void {
    this.subscriptionKey = key;
    // Reconnect with new subscription key if currently connected
    if (this.isConnected()) {
      console.log('🔄 Reconnecting with new subscription key...');
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
  }

  /**
   * Get the current API Management gateway configuration
   */
  getGatewayInfo(): {
    gatewayUrl: string;
    apiVersion: string;
    useAPIManagement: boolean;
    hasSubscriptionKey: boolean;
    hasAccessToken: boolean;
  } {
    return {
      gatewayUrl: this.gatewayUrl,
      apiVersion: this.apiVersion,
      useAPIManagement: this.useAPIManagement,
      hasSubscriptionKey: !!this.subscriptionKey,
      hasAccessToken: !!this.accessToken
    };
  }

  /**
   * Send specialized message types with API Management enhancements
   */
  async sendChatMessage(message: string, to?: string): Promise<boolean> {
    return this.sendMessage('chat.message', { 
      message, 
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      features: ['api-management', 'enterprise-chat']
    }, to);
  }

  async sendNotification(title: string, message: string, type = 'info'): Promise<boolean> {
    return this.sendMessage('notification.broadcast', {
      title,
      message,
      type,
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      features: ['api-management', 'enterprise-notifications']
    });
  }

  async sendGameMove(move: unknown): Promise<boolean> {
    return this.sendMessage('game.move', {
      move,
      id: `move-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      features: ['api-management', 'real-time-gaming']
    });
  }

  async sendDocumentEdit(operation: unknown, documentId = 'default'): Promise<boolean> {
    return this.sendMessage('document.edit', {
      operation,
      documentId,
      id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      features: ['api-management', 'collaborative-editing']
    });
  }

  /**
   * Send API Management specific health check
   */
  async sendHealthCheck(): Promise<boolean> {
    return this.sendMessage('health.check', {
      timestamp: Date.now(),
      gateway: 'azure-api-management',
      apiVersion: this.apiVersion,
      client: 'api-gateway-websocket-client'
    });
  }
}

/**
 * Create an Azure API Management WebSocket client instance
 */
export function createAPIGatewayWebSocketClient(options?: APIGatewayWebSocketOptions): APIGatewayWebSocketClient {
  return new APIGatewayWebSocketClient(options);
}

export default APIGatewayWebSocketClient;