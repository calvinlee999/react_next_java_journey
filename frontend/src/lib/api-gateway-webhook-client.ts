/**
 * Azure API Management Gateway Integration for WebHook Client
 * Enhanced WebHook client that routes through Azure API Management Gateway
 */

export interface APIGatewayWebHookOptions {
  /** Azure API Management Gateway URL */
  gatewayUrl?: string;
  /** API Management subscription key */
  subscriptionKey?: string;
  /** Azure AD access token for authentication */
  accessToken?: string;
  /** API version */
  apiVersion?: string;
  /** WebHook provider (github, stripe, generic) */
  provider?: 'github' | 'stripe' | 'generic';
  /** Enable Azure API Management specific features */
  useAPIManagement?: boolean;
}

export interface WebHookEvent {
  id: string;
  type: string;
  provider: string;
  data: unknown;
  timestamp: number;
  signature?: string;
  deliveryId?: string;
}

/**
 * Enhanced WebHook client for Azure API Management Gateway
 */
export class APIGatewayWebHookClient {
  private readonly gatewayUrl: string;
  private subscriptionKey?: string;
  private accessToken?: string;
  private readonly apiVersion: string;
  private readonly provider: string;
  private readonly useAPIManagement: boolean;
  private eventHandlers: Map<string, Array<(event: WebHookEvent) => void>> = new Map();

  constructor(options: APIGatewayWebHookOptions = {}) {
    // Default Azure API Management WebHook URL
    const defaultGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://localhost:3000';
    
    this.gatewayUrl = options.gatewayUrl || defaultGatewayUrl;
    this.subscriptionKey = options.subscriptionKey || process.env.NEXT_PUBLIC_APIM_SUBSCRIPTION_KEY;
    this.accessToken = options.accessToken;
    this.apiVersion = options.apiVersion || 'v1';
    this.provider = options.provider || 'generic';
    this.useAPIManagement = options.useAPIManagement !== false;
  }

  /**
   * Build WebHook URL with API Management parameters
   */
  private buildWebHookUrl(eventType?: string): string {
    if (!this.useAPIManagement) {
      return `${this.gatewayUrl}/webhook`;
    }

    const webhookUrl = new URL(`${this.gatewayUrl}/webhook/${this.provider}`);
    
    if (eventType) {
      webhookUrl.pathname += `/${eventType}`;
    }

    if (this.apiVersion) {
      webhookUrl.searchParams.set('api-version', this.apiVersion);
    }

    return webhookUrl.toString();
  }

  /**
   * Register a WebHook endpoint through Azure API Management Gateway
   */
  async registerWebHook(eventType: string, callbackUrl?: string): Promise<{
    webhookUrl: string;
    webhookId: string;
    provider: string;
  }> {
    const webhookUrl = this.buildWebHookUrl(eventType);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add API Management subscription key
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    // Add Azure AD access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const registrationData = {
      eventType,
      provider: this.provider,
      callbackUrl,
      apiVersion: this.apiVersion,
      timestamp: Date.now(),
      features: ['api-management', 'webhook-validation', 'enterprise-webhooks']
    };

    try {
      const response = await fetch(`${webhookUrl}/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ WebHook registered through Azure API Management Gateway: ${eventType}`);
      
      return {
        webhookUrl: webhookUrl,
        webhookId: result.webhookId || `webhook-${Date.now()}`,
        provider: this.provider
      };
    } catch (error) {
      console.error('❌ Failed to register WebHook through API Management Gateway:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WebHook events from Azure API Management Gateway
   */
  async handleWebHookEvent(
    eventType: string,
    payload: unknown,
    signature?: string,
    deliveryId?: string
  ): Promise<void> {
    const event: WebHookEvent = {
      id: deliveryId || `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: eventType,
      provider: this.provider,
      data: payload,
      timestamp: Date.now(),
      signature,
      deliveryId
    };

    console.log(`📨 Received WebHook event through API Management Gateway: ${eventType}`, {
      provider: this.provider,
      eventId: event.id,
      hasSignature: !!signature
    });

    // Trigger registered event handlers
    const handlers = this.eventHandlers.get(eventType) || [];
    const globalHandlers = this.eventHandlers.get('*') || [];
    
    [...handlers, ...globalHandlers].forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`❌ Error in WebHook event handler for ${eventType}:`, error);
      }
    });
  }

  /**
   * Subscribe to WebHook events
   */
  on(eventType: string, handler: (event: WebHookEvent) => void): () => void {
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
   * Send WebHook event through Azure API Management Gateway
   */
  async sendWebHookEvent(
    targetUrl: string,
    eventType: string,
    payload: unknown,
    options: {
      signature?: string;
      deliveryId?: string;
      retryCount?: number;
    } = {}
  ): Promise<boolean> {
    const webhookData = {
      eventType,
      provider: this.provider,
      payload,
      signature: options.signature,
      deliveryId: options.deliveryId || `delivery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      apiVersion: this.apiVersion,
      retryCount: options.retryCount || 0,
      features: ['api-management', 'webhook-delivery', 'enterprise-webhooks']
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Delivery-ID': webhookData.deliveryId,
      'X-Event-Type': eventType,
      'X-Provider': this.provider
    };

    // Add API Management subscription key
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    // Add Azure AD access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add signature if provided
    if (options.signature) {
      headers['X-Hub-Signature'] = options.signature;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        console.log(`✅ WebHook event delivered through API Management Gateway: ${eventType}`);
        return true;
      } else {
        console.error(`❌ WebHook delivery failed: HTTP ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to send WebHook event through API Management Gateway:', error);
      return false;
    }
  }

  /**
   * Validate WebHook signature (provider-specific)
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'github':
          return this.validateGitHubSignature(payload, signature, secret);
        case 'stripe':
          return this.validateStripeSignature(payload, signature, secret);
        default:
          return this.validateGenericSignature(payload, signature, secret);
      }
    } catch (error) {
      console.error('❌ Signature validation error:', error);
      return false;
    }
  }

  private validateGitHubSignature(payload: string, signature: string, secret: string): boolean {
    // GitHub uses HMAC-SHA256 with 'sha256=' prefix
    if (!signature.startsWith('sha256=')) {
      return false;
    }
    
    // This would require crypto module in a real implementation
    console.log('GitHub signature validation (mock implementation)', {
      payloadLength: payload.length,
      signature: signature.substring(0, 20) + '...',
      hasSecret: !!secret
    });
    
    return true; // Mock validation
  }

  private validateStripeSignature(payload: string, signature: string, secret: string): boolean {
    // Stripe uses timestamp and signature format
    console.log('Stripe signature validation (mock implementation)', {
      payloadLength: payload.length,
      signature: signature.substring(0, 20) + '...',
      hasSecret: !!secret
    });
    
    return true; // Mock validation
  }

  private validateGenericSignature(payload: string, signature: string, secret: string): boolean {
    // Generic HMAC validation
    console.log('Generic signature validation (mock implementation)', {
      payloadLength: payload.length,
      signature: signature.substring(0, 20) + '...',
      hasSecret: !!secret
    });
    
    return true; // Mock validation
  }

  /**
   * Set Azure AD access token for authentication
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set API Management subscription key
   */
  setSubscriptionKey(key: string): void {
    this.subscriptionKey = key;
  }

  /**
   * Get the current API Management gateway configuration
   */
  getGatewayInfo(): {
    gatewayUrl: string;
    apiVersion: string;
    provider: string;
    useAPIManagement: boolean;
    hasSubscriptionKey: boolean;
    hasAccessToken: boolean;
  } {
    return {
      gatewayUrl: this.gatewayUrl,
      apiVersion: this.apiVersion,
      provider: this.provider,
      useAPIManagement: this.useAPIManagement,
      hasSubscriptionKey: !!this.subscriptionKey,
      hasAccessToken: !!this.accessToken
    };
  }

  /**
   * List registered WebHook event handlers
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Clear all event handlers
   */
  clearAllHandlers(): void {
    this.eventHandlers.clear();
  }

  /**
   * Send health check through WebHook endpoint
   */
  async sendHealthCheck(): Promise<boolean> {
    const webhookUrl = this.buildWebHookUrl('health');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'health.check',
          timestamp: Date.now(),
          gateway: 'azure-api-management',
          provider: this.provider,
          apiVersion: this.apiVersion,
          client: 'api-gateway-webhook-client'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ WebHook health check failed:', error);
      return false;
    }
  }
}

/**
 * Create an Azure API Management WebHook client instance
 */
export function createAPIGatewayWebHookClient(options?: APIGatewayWebHookOptions): APIGatewayWebHookClient {
  return new APIGatewayWebHookClient(options);
}

export default APIGatewayWebHookClient;