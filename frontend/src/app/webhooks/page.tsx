'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * Webhook Management and Demo Page
 * Displays incoming webhooks, allows testing, and manages webhook registrations
 */

interface WebhookEvent {
  id: string;
  timestamp: number;
  source: string;
  event: string;
  data: unknown;
  headers: Record<string, string>;
  verified: boolean;
}

interface WebhookRegistration {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: number;
}

interface WebhookStats {
  events: WebhookEvent[];
  total: number;
  sources: string[];
  eventTypes: string[];
}

const WebhookDemo: React.FC = () => {
  const [webhookStats, setWebhookStats] = useState<WebhookStats>({
    events: [],
    total: 0,
    sources: [],
    eventTypes: []
  });
  const [registrations, setRegistrations] = useState<WebhookRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [testWebhookData, setTestWebhookData] = useState({
    source: 'demo',
    event: 'user.created',
    data: JSON.stringify({
      id: '12345',
      email: 'john@example.com',
      name: 'John Doe',
      created_at: new Date().toISOString()
    }, null, 2)
  });

  // Set webhook URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks`);
    }
  }, []);

  // Fetch webhook events and registrations
  const fetchWebhookData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch events
      const sourceParam = selectedSource ? `&source=${selectedSource}` : '';
      const eventsUrl = `/api/webhooks?limit=50${sourceParam}`;
      const eventsResponse = await fetch(eventsUrl);
      const eventsData = await eventsResponse.json();
      setWebhookStats(eventsData);

      // Fetch registrations
      const registrationsResponse = await fetch('/api/webhooks?type=registrations');
      const registrationsData = await registrationsResponse.json();
      setRegistrations(registrationsData.registrations || []);
    } catch (error) {
      console.error('Failed to fetch webhook data:', error);
    }
    setIsLoading(false);
  }, [selectedSource]);

  // Auto-refresh webhook events
  useEffect(() => {
    fetchWebhookData();
    const interval = setInterval(fetchWebhookData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchWebhookData]);

  // Send test webhook
  const sendTestWebhook = async () => {
    try {
      const response = await fetch(`/api/webhooks?source=${testWebhookData.source}&event=${testWebhookData.event}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'sha256=webhook-verified-test',
          'User-Agent': 'WebhookDemo/1.0'
        },
        body: testWebhookData.data
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test webhook sent:', result);
        fetchWebhookData(); // Refresh to show new webhook
      } else {
        console.error('Failed to send test webhook');
      }
    } catch (error) {
      console.error('Error sending test webhook:', error);
    }
  };

  // Clear all webhook events
  const clearWebhookEvents = async () => {
    try {
      await fetch('/api/webhooks', { method: 'DELETE' });
      fetchWebhookData();
    } catch (error) {
      console.error('Failed to clear webhook events:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = (verified: boolean) => {
    return verified ? 'text-green-600' : 'text-red-600';
  };

  // Predefined test webhook examples
  const webhookExamples = [
    {
      name: 'User Created',
      source: 'auth-service',
      event: 'user.created',
      data: {
        id: '12345',
        email: 'john@example.com',
        name: 'John Doe',
        created_at: new Date().toISOString()
      }
    },
    {
      name: 'Order Completed',
      source: 'e-commerce',
      event: 'order.completed',
      data: {
        order_id: 'ORD-789',
        customer_id: '12345',
        total: 99.99,
        items: [{ id: 'ITEM-1', name: 'Product A', price: 99.99 }],
        completed_at: new Date().toISOString()
      }
    },
    {
      name: 'Payment Processed',
      source: 'payment-gateway',
      event: 'payment.processed',
      data: {
        payment_id: 'PAY-456',
        order_id: 'ORD-789',
        amount: 99.99,
        currency: 'USD',
        status: 'completed',
        processed_at: new Date().toISOString()
      }
    },
    {
      name: 'GitHub Push',
      source: 'github',
      event: 'repository.push',
      data: {
        ref: 'refs/heads/main',
        repository: { name: 'my-app', full_name: 'user/my-app' },
        commits: [
          { id: 'abc123', message: 'Fix bug in webhook handler' },
          { id: 'def456', message: 'Add new feature' }
        ],
        pusher: { name: 'developer' }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Webhook Management & Demo
              </h1>
              
              <div className="flex gap-4">
                <Link 
                  href="/event-comparison"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ⚡ Compare with Kafka
                </Link>
              </div>
            </div>

            {/* Webhook Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Total Events</h3>
                <p className="text-2xl font-bold text-blue-900">{webhookStats.total}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Active Sources</h3>
                <p className="text-2xl font-bold text-green-900">{webhookStats.sources.length}</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800">Event Types</h3>
                <p className="text-2xl font-bold text-yellow-900">{webhookStats.eventTypes.length}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Registrations</h3>
                <p className="text-2xl font-bold text-purple-900">{registrations.length}</p>
              </div>
            </div>

            {/* Test Webhook Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Webhook</h2>
              
              {/* Quick Examples */}
              <div className="mb-4">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Examples:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {webhookExamples.map((example) => (
                    <button
                      key={`${example.source}-${example.event}`}
                      onClick={() => setTestWebhookData({
                        source: example.source,
                        event: example.event,
                        data: JSON.stringify(example.data, null, 2)
                      })}
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm text-gray-700"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="webhook-source" className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    id="webhook-source"
                    type="text"
                    value={testWebhookData.source}
                    onChange={(e) => setTestWebhookData(prev => ({ ...prev, source: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., github, stripe, auth-service"
                  />
                </div>
                
                <div>
                  <label htmlFor="webhook-event" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <input
                    id="webhook-event"
                    type="text"
                    value={testWebhookData.event}
                    onChange={(e) => setTestWebhookData(prev => ({ ...prev, event: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., user.created, order.completed"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="webhook-payload" className="block text-sm font-medium text-gray-700 mb-1">
                  JSON Payload
                </label>
                <textarea
                  id="webhook-payload"
                  value={testWebhookData.data}
                  onChange={(e) => setTestWebhookData(prev => ({ ...prev, data: e.target.value }))}
                  rows={8}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Enter JSON data..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={sendTestWebhook}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Send Test Webhook
                </button>
                
                <button
                  onClick={fetchWebhookData}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Events'}
                </button>
                
                <button
                  onClick={clearWebhookEvents}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Clear All Events
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex space-x-4 items-center">
                <label htmlFor="source-filter" className="text-sm font-medium text-gray-700">
                  Filter by Source:
                </label>
                <select
                  id="source-filter"
                  title="Filter webhooks by source"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Sources</option>
                  {webhookStats.sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Webhook Events */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Webhook Events</h2>
              
              {isLoading && (
                <div className="text-center py-8">
                  <div className="text-gray-600">Loading webhook events...</div>
                </div>
              )}
              
              {!isLoading && webhookStats.events.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-600">No webhook events found. Send a test webhook to get started!</div>
                </div>
              )}
              
              {!isLoading && webhookStats.events.length > 0 && (
                <div className="space-y-4">
                  {webhookStats.events.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                            {event.source}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">
                            {event.event}
                          </span>
                          <span className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(event.verified)}`}>
                            {event.verified ? '✓ Verified' : '✗ Unverified'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 font-medium">Event ID: </span>
                        <span className="text-xs text-gray-600 font-mono">{event.id}</span>
                      </div>
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View Details
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Headers:</h4>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.headers, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Payload:</h4>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Webhook Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">How to Send Webhooks</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Webhook URL:</strong> <code className="bg-blue-100 px-1 rounded">{webhookUrl || '/api/webhooks'}</code></p>
                <p><strong>Method:</strong> POST</p>
                <p><strong>Query Parameters:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code>source</code> - The source system (e.g., github, stripe)</li>
                  <li><code>event</code> - The event type (e.g., user.created, order.completed)</li>
                </ul>
                <p><strong>Headers:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code>Content-Type: application/json</code></li>
                  <li><code>X-Webhook-Signature</code> - Optional signature for verification</li>
                </ul>
                <p className="mt-3">
                  <strong>Example:</strong>
                </p>
                <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto mt-2">
{`curl -X POST "${webhookUrl || 'http://localhost:3005'}/api/webhooks?source=demo&event=user.created" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: sha256=webhook-verified" \\
  -d '{"id": "123", "email": "user@example.com"}'`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookDemo;
