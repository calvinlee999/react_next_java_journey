/**
 * Azure API Management Gateway Demo Component
 * 
 * This component demonstrates the enhanced WebSocket, WebHook, and REST API
 * implementations that route through Azure API Management Gateway with
 * enterprise-grade features.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  createAPIGatewayClientSuite,
  configureAPIGatewayAuthentication,
  getAPIGatewayInfo,
  performAPIGatewayHealthChecks,
  type APIGatewayClientSuite,
  type WebHookEvent,
  type User
} from '@/lib/api-gateway';

export default function APIGatewayDemo() {
  // State management
  const [clients, setClients] = useState<APIGatewayClientSuite | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    websocket: 'disconnected' as 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback',
    webhook: 'inactive' as 'active' | 'inactive' | 'error',
    rest: 'ready' as 'ready' | 'error'
  });
  const [messages, setMessages] = useState<Array<{ type: string; content: string; timestamp: number }>>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [healthStatus, setHealthStatus] = useState<{
    websocket: boolean;
    webhook: boolean;
    rest: boolean;
    overall: boolean;
  } | null>(null);

  // Configuration
  const [config, setConfig] = useState({
    gatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://localhost:3000',
    subscriptionKey: '',
    accessToken: '',
    apiVersion: 'v1',
    useAPIManagement: true
  });

  // Initialize API Gateway clients
  const initializeClients = useCallback(() => {
    try {
      const clientSuite = createAPIGatewayClientSuite({
        gatewayUrl: config.gatewayUrl,
        subscriptionKey: config.subscriptionKey || undefined,
        accessToken: config.accessToken || undefined,
        apiVersion: config.apiVersion,
        useAPIManagement: config.useAPIManagement,
        webhookProvider: 'generic'
      });

      // Configure authentication
      configureAPIGatewayAuthentication(
        clientSuite,
        config.accessToken || undefined,
        config.subscriptionKey || undefined
      );

      setClients(clientSuite);

      // Setup WebSocket event listeners
      clientSuite.websocket.onStatusChange((status) => {
        setConnectionStatus(prev => ({ ...prev, websocket: status }));
        addMessage('websocket', `Status changed to: ${status}`);
      });

      clientSuite.websocket.on('chat.message', (event) => {
        addMessage('websocket', `Received chat: ${JSON.stringify(event.data)}`);
      });

      clientSuite.websocket.on('notification.broadcast', (event) => {
        addMessage('websocket', `Received notification: ${JSON.stringify(event.data)}`);
      });

      // Setup WebHook event listeners
      clientSuite.webhook.on('*', (event: WebHookEvent) => {
        addMessage('webhook', `Received ${event.type} event from ${event.provider}`);
        setConnectionStatus(prev => ({ ...prev, webhook: 'active' }));
      });

      addMessage('system', 'API Gateway clients initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize API Gateway clients:', error);
      addMessage('error', `Failed to initialize clients: ${error}`);
    }
  }, [config]);

  // Add message to log
  const addMessage = (type: string, content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: Date.now() }].slice(-50));
  };

  // WebSocket operations
  const connectWebSocket = async () => {
    if (!clients) return;
    
    try {
      await clients.websocket.connect();
      addMessage('websocket', 'Connected to WebSocket through API Management Gateway');
    } catch (error) {
      addMessage('error', `WebSocket connection failed: ${error}`);
    }
  };

  const disconnectWebSocket = () => {
    if (!clients) return;
    
    clients.websocket.disconnect();
    addMessage('websocket', 'Disconnected from WebSocket');
  };

  const sendChatMessage = async () => {
    if (!clients) return;
    
    const message = `Hello from API Management Gateway at ${new Date().toLocaleTimeString()}`;
    const success = await clients.websocket.sendChatMessage(message);
    addMessage('websocket', `Chat message sent: ${success ? 'success' : 'failed'}`);
  };

  const sendNotification = async () => {
    if (!clients) return;
    
    const success = await clients.websocket.sendNotification(
      'API Management Demo',
      'This is a test notification through Azure API Management Gateway',
      'info'
    );
    addMessage('websocket', `Notification sent: ${success ? 'success' : 'failed'}`);
  };

  // REST API operations
  const fetchUsers = async () => {
    if (!clients) return;
    
    try {
      const response = await clients.rest.getUsers();
      setUsers(response.data);
      addMessage('rest', `Fetched ${response.data.length} users (cached: ${response.cached})`);
    } catch (error) {
      addMessage('error', `Failed to fetch users: ${error}`);
    }
  };

  const createUser = async () => {
    if (!clients) return;
    
    try {
      const newUser = {
        email: `user${Date.now()}@example.com`,
        name: `Test User ${Date.now()}`,
        role: 'user'
      };
      
      const response = await clients.rest.createUser(newUser);
      addMessage('rest', `Created user: ${response.data.name}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      addMessage('error', `Failed to create user: ${error}`);
    }
  };

  // WebHook operations
  const registerWebHook = async () => {
    if (!clients) return;
    
    try {
      const result = await clients.webhook.registerWebHook('test.event');
      addMessage('webhook', `WebHook registered: ${result.webhookId}`);
      setConnectionStatus(prev => ({ ...prev, webhook: 'active' }));
    } catch (error) {
      addMessage('error', `Failed to register webhook: ${error}`);
    }
  };

  const simulateWebHookEvent = async () => {
    if (!clients) return;
    
    try {
      await clients.webhook.handleWebHookEvent(
        'test.event',
        { message: 'This is a test webhook event', timestamp: Date.now() },
        'test-signature-123',
        `delivery-${Date.now()}`
      );
      addMessage('webhook', 'Simulated webhook event processed');
    } catch (error) {
      addMessage('error', `Failed to process webhook event: ${error}`);
    }
  };

  // Health check
  const runHealthCheck = async () => {
    if (!clients) return;
    
    try {
      const health = await performAPIGatewayHealthChecks(clients);
      setHealthStatus(health);
      addMessage('system', `Health check completed - Overall: ${health.overall ? 'healthy' : 'unhealthy'}`);
    } catch (error) {
      addMessage('error', `Health check failed: ${error}`);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeClients();
  }, [initializeClients]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clients?.websocket.isConnected()) {
        clients.websocket.disconnect();
      }
    };
  }, [clients]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Azure API Management Gateway Demo</h1>
      
      {/* Configuration */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="gatewayUrl" className="block text-sm font-medium mb-1">Gateway URL</label>
            <input
              id="gatewayUrl"
              type="text"
              value={config.gatewayUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, gatewayUrl: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="apiVersion" className="block text-sm font-medium mb-1">API Version</label>
            <input
              id="apiVersion"
              type="text"
              value={config.apiVersion}
              onChange={(e) => setConfig(prev => ({ ...prev, apiVersion: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="subscriptionKey" className="block text-sm font-medium mb-1">Subscription Key</label>
            <input
              id="subscriptionKey"
              type="password"
              value={config.subscriptionKey}
              onChange={(e) => setConfig(prev => ({ ...prev, subscriptionKey: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="Optional APIM subscription key"
            />
          </div>
          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium mb-1">Access Token</label>
            <input
              id="accessToken"
              type="password"
              value={config.accessToken}
              onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="Optional Azure AD token"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.useAPIManagement}
              onChange={(e) => setConfig(prev => ({ ...prev, useAPIManagement: e.target.checked }))}
              className="mr-2"
            />
            <span>Use Azure API Management Gateway</span>
          </label>
        </div>
        <button
          onClick={initializeClients}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reinitialize Clients
        </button>
      </div>

      {/* Status Panel */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 rounded ${connectionStatus.websocket === 'connected' ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-medium">WebSocket</h3>
            <p className="text-sm">{connectionStatus.websocket}</p>
          </div>
          <div className={`p-3 rounded ${connectionStatus.webhook === 'active' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <h3 className="font-medium">WebHook</h3>
            <p className="text-sm">{connectionStatus.webhook}</p>
          </div>
          <div className={`p-3 rounded ${connectionStatus.rest === 'ready' ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-medium">REST API</h3>
            <p className="text-sm">{connectionStatus.rest}</p>
          </div>
        </div>
        
        {healthStatus && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Health Status</h3>
            <div className={`p-2 rounded text-sm ${healthStatus.overall ? 'bg-green-200' : 'bg-red-200'}`}>
              Overall: {healthStatus.overall ? 'Healthy' : 'Unhealthy'} | 
              WS: {healthStatus.websocket ? '✓' : '✗'} | 
              WH: {healthStatus.webhook ? '✓' : '✗'} | 
              REST: {healthStatus.rest ? '✓' : '✗'}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* WebSocket Controls */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">WebSocket Operations</h3>
          <div className="space-y-2">
            <button
              onClick={connectWebSocket}
              disabled={connectionStatus.websocket === 'connected'}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Connect
            </button>
            <button
              onClick={disconnectWebSocket}
              disabled={connectionStatus.websocket !== 'connected'}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Disconnect
            </button>
            <button
              onClick={sendChatMessage}
              disabled={connectionStatus.websocket !== 'connected'}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Send Chat
            </button>
            <button
              onClick={sendNotification}
              disabled={connectionStatus.websocket !== 'connected'}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
            >
              Send Notification
            </button>
          </div>
        </div>

        {/* REST API Controls */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">REST API Operations</h3>
          <div className="space-y-2">
            <button
              onClick={fetchUsers}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Fetch Users
            </button>
            <button
              onClick={createUser}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create User
            </button>
            <div className="text-sm text-gray-600">
              Users: {users.length}
            </div>
          </div>
        </div>

        {/* WebHook Controls */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">WebHook Operations</h3>
          <div className="space-y-2">
            <button
              onClick={registerWebHook}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Register WebHook
            </button>
            <button
              onClick={simulateWebHookEvent}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Simulate Event
            </button>
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">System Operations</h3>
        <button
          onClick={runHealthCheck}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Run Health Check
        </button>
      </div>

      {/* Message Log */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Event Log</h3>
        <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
          {messages.map((msg) => {
            const getMessageColor = (type: string): string => {
              switch (type) {
                case 'error': return 'text-red-600';
                case 'websocket': return 'text-blue-600';
                case 'webhook': return 'text-orange-600';
                case 'rest': return 'text-green-600';
                default: return 'text-gray-600';
              }
            };

            return (
              <div key={`${msg.timestamp}-${msg.type}`} className={`mb-1 ${getMessageColor(msg.type)}`}>
                <span className="text-gray-400">
                  [{new Date(msg.timestamp).toLocaleTimeString()}]
                </span>
                <span className="font-medium"> [{msg.type}]</span> {msg.content}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setMessages([])}
          className="mt-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Clear Log
        </button>
      </div>

      {/* Gateway Info */}
      {clients && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Gateway Configuration</h3>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(getAPIGatewayInfo(clients), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}