/**
 * Azure API Management Gateway Integration Library
 * 
 * This library provides enhanced clients for WebSocket, WebHook, and REST API
 * communications that route through Azure API Management Gateway with enterprise-grade
 * features including:
 * 
 * - Authentication and authorization via Azure AD and subscription keys
 * - Request/response logging and monitoring
 * - Rate limiting and throttling
 * - Caching and performance optimization
 * - Error handling and retry logic
 * - Security policies and validation
 * - Health checks and metrics
 */

// WebSocket Integration
export {
  APIGatewayWebSocketClient,
  createAPIGatewayWebSocketClient,
  type APIGatewayWebSocketOptions
} from './api-gateway-websocket-client';

// WebHook Integration
export {
  APIGatewayWebHookClient,
  createAPIGatewayWebHookClient,
  type APIGatewayWebHookOptions,
  type WebHookEvent
} from './api-gateway-webhook-client';

// REST API Integration
export {
  APIGatewayRestClient,
  createAPIGatewayRestClient,
  type APIGatewayRestOptions,
  type APIResponse,
  type User
} from './api-gateway-rest-client';

// Import the actual classes for internal use
import { 
  APIGatewayWebSocketClient, 
  createAPIGatewayWebSocketClient 
} from './api-gateway-websocket-client';
import { 
  APIGatewayWebHookClient, 
  createAPIGatewayWebHookClient 
} from './api-gateway-webhook-client';
import { 
  APIGatewayRestClient, 
  createAPIGatewayRestClient 
} from './api-gateway-rest-client';

/**
 * Create a complete API Gateway client suite with all three communication types
 */
export interface APIGatewayClientSuiteOptions {
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
  /** WebHook provider for webhook client */
  webhookProvider?: 'github' | 'stripe' | 'generic';
}

export interface APIGatewayClientSuite {
  websocket: APIGatewayWebSocketClient;
  webhook: APIGatewayWebHookClient;
  rest: APIGatewayRestClient;
}

/**
 * Create a complete suite of API Gateway clients for all communication types
 */
export function createAPIGatewayClientSuite(options: APIGatewayClientSuiteOptions = {}): APIGatewayClientSuite {
  const baseOptions = {
    gatewayUrl: options.gatewayUrl,
    subscriptionKey: options.subscriptionKey,
    accessToken: options.accessToken,
    apiVersion: options.apiVersion,
    useAPIManagement: options.useAPIManagement
  };

  return {
    websocket: createAPIGatewayWebSocketClient(baseOptions),
    webhook: createAPIGatewayWebHookClient({
      ...baseOptions,
      provider: options.webhookProvider
    }),
    rest: createAPIGatewayRestClient(baseOptions)
  };
}

/**
 * Utility function to configure all clients with the same authentication
 */
export function configureAPIGatewayAuthentication(
  clients: APIGatewayClientSuite,
  accessToken?: string,
  subscriptionKey?: string
): void {
  if (accessToken) {
    clients.websocket.setAccessToken(accessToken);
    clients.webhook.setAccessToken(accessToken);
    clients.rest.setAccessToken(accessToken);
  }

  if (subscriptionKey) {
    clients.websocket.setSubscriptionKey(subscriptionKey);
    clients.webhook.setSubscriptionKey(subscriptionKey);
    clients.rest.setSubscriptionKey(subscriptionKey);
  }
}

/**
 * Get gateway information from all clients
 */
export function getAPIGatewayInfo(clients: APIGatewayClientSuite): {
  websocket: ReturnType<APIGatewayWebSocketClient['getGatewayInfo']>;
  webhook: ReturnType<APIGatewayWebHookClient['getGatewayInfo']>;
  rest: ReturnType<APIGatewayRestClient['getGatewayInfo']>;
} {
  return {
    websocket: clients.websocket.getGatewayInfo(),
    webhook: clients.webhook.getGatewayInfo(),
    rest: clients.rest.getGatewayInfo()
  };
}

/**
 * Perform health checks on all clients
 */
export async function performAPIGatewayHealthChecks(clients: APIGatewayClientSuite): Promise<{
  websocket: boolean;
  webhook: boolean;
  rest: boolean;
  overall: boolean;
}> {
  const results = await Promise.allSettled([
    clients.websocket.sendHealthCheck(),
    clients.webhook.sendHealthCheck(),
    clients.rest.healthCheck()
  ]);

  const websocketHealth = results[0].status === 'fulfilled' ? results[0].value : false;
  const webhookHealth = results[1].status === 'fulfilled' ? results[1].value : false;
  const restHealth = results[2].status === 'fulfilled' ? results[2].value.data.status === 'healthy' : false;

  return {
    websocket: websocketHealth,
    webhook: webhookHealth,
    rest: restHealth,
    overall: websocketHealth && webhookHealth && restHealth
  };
}

// Default export
const apiGateway = {
  createAPIGatewayWebSocketClient,
  createAPIGatewayWebHookClient,
  createAPIGatewayRestClient,
  createAPIGatewayClientSuite,
  configureAPIGatewayAuthentication,
  getAPIGatewayInfo,
  performAPIGatewayHealthChecks
};

export default apiGateway;