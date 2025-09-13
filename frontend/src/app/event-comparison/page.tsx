'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import our Confluent Cloud component
import ConfluentCloudAsyncAPIComponent from '@/components/ConfluentCloudAsyncAPIComponent';

type WebhookStatus = 'delivered' | 'failed' | 'pending' | 'retry';

interface WebhookEvent {
  id: string;
  timestamp: number;
  source: string;
  event: string;
  data: unknown;
  headers: Record<string, string>;
  verified: boolean;
  deliveryAttempts?: number;
  status: WebhookStatus;
}

interface KafkaEvent {
  id: string;
  topic: string;
  partition: number;
  offset: number;
  key?: string;
  value: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

interface JourneyEvent {
  id: string;
  journeyId: string;
  eventType: string;
  userId: string;
  source: string;
  timestamp: number;
  data: unknown;
  nextStep?: string;
  orchestrationState: 'initiated' | 'processing' | 'completed' | 'failed';
}

interface ComparisonMetrics {
  throughput: number;
  latency: number;
  reliability: number;
  deliveryGuarantee: string;
  ordering: string;
  replay: boolean;
}

const EventDrivenComparisonDemo: React.FC = () => {
  // WebHook state
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookMetrics, setWebhookMetrics] = useState<ComparisonMetrics>({
    throughput: 150,
    latency: 250,
    reliability: 85,
    deliveryGuarantee: 'Best effort with retries',
    ordering: 'No guarantee',
    replay: false
  });

  // Kafka state
  const [kafkaEvents, setKafkaEvents] = useState<KafkaEvent[]>([]);
  const [kafkaMetrics, setKafkaMetrics] = useState<ComparisonMetrics>({
    throughput: 50000,
    latency: 2,
    reliability: 99.9,
    deliveryGuarantee: 'At-least-once with transactions',
    ordering: 'Partition-level ordering',
    replay: true
  });

  // Journey orchestrator state
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);
  const [journeyMetrics, setJourneyMetrics] = useState<ComparisonMetrics>({
    throughput: 15000,
    latency: 5,
    reliability: 99.5,
    deliveryGuarantee: 'Event-driven with saga patterns',
    ordering: 'Business process ordering',
    replay: true
  });

  // Demo control state
  const [isWebhookRunning, setIsWebhookRunning] = useState(false);
  const [isKafkaRunning, setIsKafkaRunning] = useState(false);
  const [isJourneyRunning, setIsJourneyRunning] = useState(false);

  // Test event data
  const [testEventData, setTestEventData] = useState({
    userId: 123,
    action: 'user_login',
    timestamp: new Date().toISOString(),
    metadata: { source: 'web-app', sessionId: 'sess_123' }
  });

  // WebHook simulation
  const simulateWebhookEvent = useCallback(() => {
    const eventTypes = ['user.created', 'user.updated', 'order.placed', 'payment.processed', 'notification.sent'];
    const sources = ['auth-service', 'order-service', 'payment-service', 'notification-service'];
    
    const randomValue = Math.random();
    let deliveryStatus: 'delivered' | 'failed' | 'pending' | 'retry';
    if (randomValue > 0.15) {
      deliveryStatus = 'delivered';
    } else if (randomValue > 0.05) {
      deliveryStatus = 'retry';
    } else {
      deliveryStatus = 'failed';
    }
    
    const newEvent: WebhookEvent = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      source: sources[Math.floor(Math.random() * sources.length)],
      event: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      data: {
        ...testEventData,
        userId: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString()
      },
      headers: {
        'content-type': 'application/json',
        'user-agent': 'webhook-service/1.0',
        'x-webhook-signature': 'sha256=' + Math.random().toString(36)
      },
      verified: Math.random() > 0.1, // 90% verification success
      deliveryAttempts: Math.floor(Math.random() * 3) + 1,
      status: deliveryStatus as 'delivered' | 'failed' | 'pending' | 'retry'
    };

    setWebhookEvents(prev => [newEvent, ...prev.slice(0, 49)]);
    
    // Update metrics
    setWebhookMetrics(prev => ({
      ...prev,
      throughput: prev.throughput + Math.floor(Math.random() * 20) - 10,
      latency: prev.latency + Math.floor(Math.random() * 100) - 50,
      reliability: Math.max(75, Math.min(95, prev.reliability + Math.random() * 4 - 2))
    }));
  }, [testEventData]);

  // Kafka simulation
  const simulateKafkaEvent = useCallback(() => {
    const topics = ['user-events', 'order-events', 'payment-events', 'notification-events'];
    
    const newEvent: KafkaEvent = {
      id: `kafka_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: topics[Math.floor(Math.random() * topics.length)],
      partition: Math.floor(Math.random() * 4),
      offset: Math.floor(Math.random() * 100000),
      key: `key_${Math.floor(Math.random() * 1000)}`,
      value: {
        ...testEventData,
        userId: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now(),
      headers: {
        'source': 'kafka-producer',
        'schema-version': '1.0'
      }
    };

    setKafkaEvents(prev => [newEvent, ...prev.slice(0, 49)]);
    
    // Update metrics
    setKafkaMetrics(prev => ({
      ...prev,
      throughput: prev.throughput + Math.floor(Math.random() * 1000) - 500,
      latency: Math.max(1, prev.latency + Math.random() * 2 - 1),
      reliability: Math.max(99.5, Math.min(99.99, prev.reliability + Math.random() * 0.1 - 0.05))
    }));
  }, [testEventData]);

  // Journey orchestrator simulation
  const simulateJourneyEvent = useCallback(() => {
    const journeyTypes = [
      { type: 'loan.application.submitted', next: 'credit.check.initiated' },
      { type: 'credit.check.initiated', next: 'credit.decision.made' },
      { type: 'credit.decision.made', next: 'contract.generation.requested' },
      { type: 'contract.generated', next: 'contract.signature.requested' },
      { type: 'contract.signed', next: 'funds.disbursement.initiated' },
      { type: 'funds.disbursed', next: 'journey.completed' }
    ];
    
    const sources = ['journey-orchestrator', 'credit-service', 'contract-service', 'payment-service'];
    const selectedJourney = journeyTypes[Math.floor(Math.random() * journeyTypes.length)];
    
    const orchestrationStates: ('initiated' | 'processing' | 'completed' | 'failed')[] = 
      ['initiated', 'processing', 'completed', 'failed'];
    const state = orchestrationStates[Math.floor(Math.random() * 4)];
    
    const newEvent: JourneyEvent = {
      id: `journey_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      journeyId: `journey_${Math.floor(Math.random() * 1000)}`,
      eventType: selectedJourney.type,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      timestamp: Date.now(),
      data: {
        ...testEventData,
        loanAmount: Math.floor(Math.random() * 50000) + 10000,
        creditScore: Math.floor(Math.random() * 300) + 500,
        riskCategory: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]
      },
      nextStep: selectedJourney.next,
      orchestrationState: state
    };

    setJourneyEvents(prev => [newEvent, ...prev.slice(0, 49)]);
    
    // Update metrics
    setJourneyMetrics(prev => ({
      ...prev,
      throughput: prev.throughput + Math.floor(Math.random() * 500) - 250,
      latency: Math.max(2, prev.latency + Math.random() * 3 - 1.5),
      reliability: Math.max(99, Math.min(99.9, prev.reliability + Math.random() * 0.2 - 0.1))
    }));
  }, [testEventData]);

  // Start/stop simulations
  useEffect(() => {
    let webhookInterval: NodeJS.Timeout;
    let kafkaInterval: NodeJS.Timeout;
    let journeyInterval: NodeJS.Timeout;

    if (isWebhookRunning) {
      webhookInterval = setInterval(simulateWebhookEvent, 2000); // Every 2 seconds
    }

    if (isKafkaRunning) {
      kafkaInterval = setInterval(simulateKafkaEvent, 500); // Every 0.5 seconds
    }

    if (isJourneyRunning) {
      journeyInterval = setInterval(simulateJourneyEvent, 1500); // Every 1.5 seconds
    }

    return () => {
      if (webhookInterval) clearInterval(webhookInterval);
      if (kafkaInterval) clearInterval(kafkaInterval);
      if (journeyInterval) clearInterval(journeyInterval);
    };
  }, [isWebhookRunning, isKafkaRunning, isJourneyRunning, simulateWebhookEvent, simulateKafkaEvent, simulateJourneyEvent]);

  const sendTestEvent = async (type: 'webhook' | 'kafka' | 'journey') => {
    if (type === 'webhook') {
      simulateWebhookEvent();
    } else if (type === 'kafka') {
      simulateKafkaEvent();
    } else {
      simulateJourneyEvent();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'retry':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Event-Driven Architecture Comparison
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Compare WebHooks vs Apache Kafka for event-driven architecture patterns. 
          See real-time performance, reliability, and feature differences.
        </p>
      </div>

      {/* High-level comparison metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>WebHook Throughput:</span>
                <Badge variant="secondary">{webhookMetrics.throughput}/sec</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kafka Throughput:</span>
                <Badge variant="default">{kafkaMetrics.throughput.toLocaleString()}/sec</Badge>
              </div>
              <div className="flex justify-between">
                <span>Journey Throughput:</span>
                <Badge variant="outline">{journeyMetrics.throughput.toLocaleString()}/sec</Badge>
              </div>
              <div className="flex justify-between">
                <span>WebHook Latency:</span>
                <Badge variant="secondary">{webhookMetrics.latency}ms</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kafka Latency:</span>
                <Badge variant="default">{kafkaMetrics.latency}ms</Badge>
              </div>
              <div className="flex justify-between">
                <span>Journey Latency:</span>
                <Badge variant="outline">{journeyMetrics.latency}ms</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛡️ Reliability Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>WebHook Reliability:</span>
                <Badge variant="secondary">{webhookMetrics.reliability.toFixed(1)}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kafka Reliability:</span>
                <Badge variant="default">{kafkaMetrics.reliability.toFixed(2)}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Journey Reliability:</span>
                <Badge variant="outline">{journeyMetrics.reliability.toFixed(2)}%</Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div>WebHook: {webhookMetrics.deliveryGuarantee}</div>
                <div>Kafka: {kafkaMetrics.deliveryGuarantee}</div>
                <div>Journey: {journeyMetrics.deliveryGuarantee}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✨ Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Message Ordering:</span>
                <div className="text-right text-sm">
                  <div>WebHook: ❌ None</div>
                  <div>Kafka: ✅ Partition-level</div>
                  <div>Journey: ✅ Business process</div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Orchestration:</span>
                <div className="text-right text-sm">
                  <div>WebHook: ❌ Manual</div>
                  <div>Kafka: ⚠️ Consumer logic</div>
                  <div>Journey: ✅ Automated</div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Business Logic:</span>
                <div className="text-right text-sm">
                  <div>WebHook: ⚠️ Scattered</div>
                  <div>Kafka: ⚠️ Consumer-based</div>
                  <div>Journey: ✅ Centralized</div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Saga Patterns:</span>
                <div className="text-right text-sm">
                  <div>WebHook: ❌ No</div>
                  <div>Kafka: ⚠️ Manual</div>
                  <div>Journey: ✅ Built-in</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 Journey Orchestration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="font-semibold">User Journey Events:</div>
                <div>• Loan Application → Credit Check</div>
                <div>• Credit Decision → Contract Gen</div>
                <div>• Contract Signed → Funds Disbursed</div>
                <div>• Automatic compensation handling</div>
                <div>• End-to-end audit trail</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo controls */}
      <Card>
        <CardHeader>
          <CardTitle>Live Demo Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">WebHook Simulation</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsWebhookRunning(!isWebhookRunning)}
                  variant={isWebhookRunning ? "destructive" : "default"}
                >
                  {isWebhookRunning ? 'Stop WebHook Simulation' : 'Start WebHook Simulation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTestEvent('webhook')}
                >
                  Send Test WebHook
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kafka Simulation</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsKafkaRunning(!isKafkaRunning)}
                  variant={isKafkaRunning ? "destructive" : "default"}
                >
                  {isKafkaRunning ? 'Stop Kafka Simulation' : 'Start Kafka Simulation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTestEvent('kafka')}
                >
                  Send Test Kafka Event
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Journey Orchestration</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsJourneyRunning(!isJourneyRunning)}
                  variant={isJourneyRunning ? "destructive" : "outline"}
                >
                  {isJourneyRunning ? 'Stop Journey Sim' : 'Start Journey Sim'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTestEvent('journey')}
                >
                  Send Journey Event
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Test Event Data</h3>
            <Textarea
              value={JSON.stringify(testEventData, null, 2)}
              onChange={(e) => {
                try {
                  setTestEventData(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore for now
                  console.warn('Invalid JSON in test event data');
                }
              }}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side event streams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WebHook Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌐 WebHook Events
              <Badge variant="secondary">{webhookEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {webhookEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.source}</Badge>
                      <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      Attempts: {event.deliveryAttempts}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1">{event.event}</div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                    {event.verified ? ' ✅ Verified' : ' ❌ Unverified'}
                  </div>
                </div>
              ))}
              {webhookEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No WebHook events yet. Start the simulation or send a test event.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kafka Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Kafka Events
              <Badge variant="default">{kafkaEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {kafkaEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{event.topic}</Badge>
                      <Badge variant="outline">P{event.partition}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      Offset: {event.offset}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1">Key: {event.key}</div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.value, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                    ✅ Guaranteed Delivery
                  </div>
                </div>
              ))}
              {kafkaEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No Kafka events yet. Start the simulation or send a test event.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journey Orchestrator Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Journey Events
              <Badge variant="outline">{journeyEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {journeyEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.source}</Badge>
                      <Badge className={getStatusColor(event.orchestrationState)}>
                        {event.orchestrationState}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      Journey: {event.journeyId.split('_')[1]}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1">{event.eventType}</div>
                  <div className="text-xs text-blue-600 mb-2">
                    Next: {event.nextStep}
                  </div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                    ✅ Orchestrated Flow
                  </div>
                </div>
              ))}
              {journeyEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No Journey events yet. Start the simulation or send a test event.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Architecture Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="reliability">Reliability</TabsTrigger>
              <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">WebHooks</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✅ Simple HTTP-based integration</li>
                    <li>✅ Easy to implement and debug</li>
                    <li>✅ Universal platform support</li>
                    <li>✅ Built-in authentication (signatures)</li>
                    <li>❌ Limited throughput</li>
                    <li>❌ No ordering guarantees</li>
                    <li>❌ No native replay capability</li>
                    <li>❌ Dependent on HTTP reliability</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Apache Kafka</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✅ Extremely high throughput</li>
                    <li>✅ Guaranteed message delivery</li>
                    <li>✅ Partition-level ordering</li>
                    <li>✅ Message replay and time-travel</li>
                    <li>✅ Schema evolution support</li>
                    <li>✅ Built-in stream processing</li>
                    <li>❌ More complex setup</li>
                    <li>❌ Requires infrastructure management</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Journey Orchestration</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✅ Centralized business logic</li>
                    <li>✅ Journey state management</li>
                    <li>✅ Multi-step orchestration</li>
                    <li>✅ Event-driven architecture</li>
                    <li>✅ Error handling & compensation</li>
                    <li>✅ Built-in monitoring</li>
                    <li>❌ Additional complexity</li>
                    <li>❌ Requires event backbone</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">WebHook Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Typical Throughput:</span>
                      <span>100-1,000 events/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>100-500ms (HTTP overhead)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scalability:</span>
                      <span>Vertical (limited by HTTP)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batching:</span>
                      <span>❌ Request per event</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kafka Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Typical Throughput:</span>
                      <span>1M+ events/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>1-10ms (optimized)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scalability:</span>
                      <span>Horizontal (partitions)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batching:</span>
                      <span>✅ Efficient batching</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Journey Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Typical Throughput:</span>
                      <span>15K+ journeys/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>5-50ms (orchestration)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scalability:</span>
                      <span>Horizontal (microservices)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batching:</span>
                      <span>✅ Journey-based batching</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reliability">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">WebHook Reliability</h3>
                  <div className="space-y-3">
                    <Alert>
                      <AlertDescription>
                        <strong>Delivery:</strong> Best effort with retry logic. 
                        Messages can be lost if receiver is unavailable.
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm space-y-1">
                      <div>• HTTP status codes for acknowledgment</div>
                      <div>• Exponential backoff retry patterns</div>
                      <div>• No built-in duplicate detection</div>
                      <div>• Dependent on network reliability</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kafka Reliability</h3>
                  <div className="space-y-3">
                    <Alert>
                      <AlertDescription>
                        <strong>Delivery:</strong> At-least-once with exactly-once 
                        semantics available through transactions.
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm space-y-1">
                      <div>• Configurable acknowledgment levels</div>
                      <div>• Built-in replication and failover</div>
                      <div>• Transactional guarantees</div>
                      <div>• Persistent storage with retention policies</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Journey Reliability</h3>
                  <div className="space-y-3">
                    <Alert>
                      <AlertDescription>
                        <strong>Delivery:</strong> Orchestrated delivery with 
                        compensating actions and saga patterns.
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm space-y-1">
                      <div>• Built-in state management</div>
                      <div>• Compensation and rollback actions</div>
                      <div>• Journey-level error handling</div>
                      <div>• Event-driven resilience patterns</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="use-cases">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">When to Choose WebHooks</h3>
                  <ul className="space-y-2 text-sm">
                    <li>🎯 <strong>Simple integrations</strong> with external services</li>
                    <li>🎯 <strong>Low-volume events</strong> (&lt;1,000/hour)</li>
                    <li>🎯 <strong>Third-party services</strong> (GitHub, Stripe, etc.)</li>
                    <li>🎯 <strong>Quick prototyping</strong> and MVP development</li>
                    <li>🎯 <strong>One-to-one communication</strong> patterns</li>
                    <li>🎯 <strong>Human-readable debugging</strong> requirements</li>
                    <li>🎯 <strong>Stateless processing</strong> without replay needs</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">When to Choose Kafka</h3>
                  <ul className="space-y-2 text-sm">
                    <li>🚀 <strong>High-throughput systems</strong> (&gt;10,000/sec)</li>
                    <li>🚀 <strong>Event sourcing</strong> and audit trails</li>
                    <li>🚀 <strong>Microservices architecture</strong> with multiple consumers</li>
                    <li>🚀 <strong>Real-time analytics</strong> and stream processing</li>
                    <li>🚀 <strong>Mission-critical systems</strong> requiring guarantees</li>
                    <li>🚀 <strong>Complex event processing</strong> and transformations</li>
                    <li>🚀 <strong>Data pipeline</strong> and ETL workloads</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Confluent Cloud Integration */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Advanced Kafka Integration with Confluent Cloud</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfluentCloudAsyncAPIComponent />
        </CardContent>
      </Card>

      {/* Implementation guides */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Implementation Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">WebHook Resources</h3>
              <div className="space-y-2 text-sm">
                <div>📄 <a href="/webhooks" className="text-blue-600 hover:underline">WebHook Management Demo</a></div>
                <div>🔧 <a href="/api/webhooks" className="text-blue-600 hover:underline">WebHook API Implementation</a></div>
                <div>📖 <a href="/docs/webhooks" className="text-blue-600 hover:underline">WebHook Best Practices</a></div>
                <div>🛡️ Security: HMAC signatures, IP allowlisting</div>
                <div>📊 Monitoring: HTTP status codes, response times</div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kafka Resources</h3>
              <div className="space-y-2 text-sm">
                <div>📄 <a href="/docs/event-driven-architecture-comparison.md" className="text-blue-600 hover:underline">Architecture Comparison Guide</a></div>
                <div>🏗️ <a href="/infrastructure/bicep/confluent-cloud-azure-clean.bicep" className="text-blue-600 hover:underline">Confluent Cloud Infrastructure</a></div>
                <div>💻 <a href="/frontend/src/lib/confluent-cloud-sdk.ts" className="text-blue-600 hover:underline">TypeScript SDK</a></div>
                <div>🚀 Deployment: Automated Bicep templates</div>
                <div>📊 Monitoring: JMX metrics, consumer lag</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDrivenComparisonDemo;