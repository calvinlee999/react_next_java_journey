import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  MessageSquare, 
  Database, 
  Pause, 
  Zap,
  GitBranch,
  BarChart3,
  Webhook,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from './ui/icons';

// Mock implementations (in real app, these would import from the SDK)
interface ConfluentMessage {
  id: string;
  topic: string;
  key?: string;
  value: unknown;
  timestamp: number;
  partition: number;
  offset: number;
}

interface FlinkJob {
  id: string;
  name: string;
  status: 'RUNNING' | 'FINISHED' | 'FAILED' | 'CANCELED';
  startTime: number;
  metrics?: {
    processedRecords: number;
    throughputPerSecond: number;
    latency: number;
  };
}

interface AsyncAPIChannel {
  name: string;
  description: string;
  messageCount: number;
  lastMessage?: Date;
}

interface WebhookComparison {
  feature: string;
  kafka: string;
  webhook: string;
  winner: 'kafka' | 'webhook' | 'tie';
}

export default function ConfluentCloudAsyncAPIComponent() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Kafka state
  const [topics, setTopics] = useState<string[]>([
    'user-events', 'order-events', 'payment-events', 'notification-events'
  ]);
  const [newTopicName, setNewTopicName] = useState('');
  const [messages, setMessages] = useState<ConfluentMessage[]>([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('user-events');

  // Flink state
  const [flinkJobs, setFlinkJobs] = useState<FlinkJob[]>([]);
  const [newJobName, setNewJobName] = useState('');
  const [newJobSql, setNewJobSql] = useState('SELECT * FROM user_events WHERE action = \'login\'');

  // AsyncAPI state
  const [asyncChannels, setAsyncChannels] = useState<AsyncAPIChannel[]>([
    { name: 'user-events', description: 'User activity events', messageCount: 1543, lastMessage: new Date() },
    { name: 'order-events', description: 'E-commerce order events', messageCount: 892, lastMessage: new Date(Date.now() - 300000) },
    { name: 'payment-events', description: 'Payment processing events', messageCount: 234, lastMessage: new Date(Date.now() - 600000) }
  ]);

  // ksqlDB state
  const [ksqlQueries, setKsqlQueries] = useState<string[]>([]);
  const [newKsqlQuery, setNewKsqlQuery] = useState('CREATE STREAM user_stream (user_id INT, action STRING) WITH (KAFKA_TOPIC=\'user-events\', VALUE_FORMAT=\'JSON\');');
  const [queryResults, setQueryResults] = useState<unknown[]>([]);

  // Webhook comparison data
  const webhookComparison: WebhookComparison[] = [
    { feature: 'Delivery Guarantee', kafka: 'At-least-once with transactions', webhook: 'Best effort (HTTP retries)', winner: 'kafka' },
    { feature: 'Ordering', kafka: 'Partition-level ordering', webhook: 'No ordering guarantees', winner: 'kafka' },
    { feature: 'Throughput', kafka: 'Millions of messages/sec', webhook: 'Limited by HTTP overhead', winner: 'kafka' },
    { feature: 'Latency', kafka: 'Sub-millisecond', webhook: 'HTTP request/response cycle', winner: 'kafka' },
    { feature: 'Backpressure', kafka: 'Built-in consumer lag management', webhook: 'HTTP 429/503 responses', winner: 'kafka' },
    { feature: 'Setup Complexity', kafka: 'Requires infrastructure setup', webhook: 'Simple HTTP endpoint', winner: 'webhook' },
    { feature: 'Debugging', kafka: 'Topic browsing, offset tracking', webhook: 'HTTP logs, status codes', winner: 'webhook' },
    { feature: 'Replay', kafka: 'Native message replay', webhook: 'No native replay', winner: 'kafka' },
    { feature: 'Filtering', kafka: 'Consumer-side filtering', webhook: 'Publisher-side filtering', winner: 'tie' },
    { feature: 'Schema Evolution', kafka: 'Schema Registry support', webhook: 'Manual versioning', winner: 'kafka' }
  ];

  // Connection management
  const handleConnect = useCallback(async () => {
    setConnectionStatus('connecting');
    // Simulate connection delay
    setTimeout(() => {
      setConnectionStatus('connected');
      setIsConnected(true);
      startMessageSimulation();
    }, 2000);
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setIsConnected(false);
  }, []);

  // Topic management
  const handleCreateTopic = useCallback(async () => {
    if (newTopicName.trim()) {
      setTopics(prev => [...prev, newTopicName.trim()]);
      setNewTopicName('');
    }
  }, [newTopicName]);

  // Message handling
  const handleSendMessage = useCallback(async () => {
    if (messageToSend.trim() && selectedTopic) {
      const newMessage: ConfluentMessage = {
        id: `msg-${Date.now()}`,
        topic: selectedTopic,
        key: `key-${Date.now()}`,
        value: JSON.parse(messageToSend || '{}'),
        timestamp: Date.now(),
        partition: Math.floor(Math.random() * 4),
        offset: Math.floor(Math.random() * 10000)
      };

      setMessages(prev => [newMessage, ...prev.slice(0, 49)]); // Keep last 50 messages
      setMessageToSend('');

      // Update AsyncAPI channel stats
      setAsyncChannels(prev => prev.map(channel => 
        channel.name === selectedTopic 
          ? { ...channel, messageCount: channel.messageCount + 1, lastMessage: new Date() }
          : channel
      ));
    }
  }, [messageToSend, selectedTopic]);

  // Flink job management
  const handleSubmitFlinkJob = useCallback(async () => {
    if (newJobName.trim()) {
      const newJob: FlinkJob = {
        id: `job-${Date.now()}`,
        name: newJobName.trim(),
        status: 'RUNNING',
        startTime: Date.now(),
        metrics: {
          processedRecords: 0,
          throughputPerSecond: Math.floor(Math.random() * 1000),
          latency: Math.floor(Math.random() * 100)
        }
      };

      setFlinkJobs(prev => [...prev, newJob]);
      setNewJobName('');
    }
  }, [newJobName]);

  const handleStopFlinkJob = useCallback((jobId: string) => {
    setFlinkJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'FINISHED' } : job
    ));
  }, []);

  // ksqlDB query execution
  const handleExecuteKsqlQuery = useCallback(async () => {
    if (newKsqlQuery.trim()) {
      setKsqlQueries(prev => [...prev, newKsqlQuery.trim()]);
      
      // Mock query results
      const mockResults = [
        { user_id: 1, action: 'login', timestamp: new Date().toISOString() },
        { user_id: 2, action: 'purchase', timestamp: new Date().toISOString() },
        { user_id: 3, action: 'logout', timestamp: new Date().toISOString() }
      ];
      
      setQueryResults(mockResults);
      setNewKsqlQuery('');
    }
  }, [newKsqlQuery]);

  // Message simulation
  const startMessageSimulation = useCallback(() => {
    const interval = setInterval(() => {
      if (topics.length > 0) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const simulatedMessage: ConfluentMessage = {
          id: `sim-${Date.now()}`,
          topic: randomTopic,
          key: `auto-key-${Date.now()}`,
          value: {
            userId: Math.floor(Math.random() * 1000),
            action: ['login', 'logout', 'purchase', 'view'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
          },
          timestamp: Date.now(),
          partition: Math.floor(Math.random() * 4),
          offset: Math.floor(Math.random() * 10000)
        };

        setMessages(prev => [simulatedMessage, ...prev.slice(0, 49)]);
        
        // Update channel stats
        setAsyncChannels(prev => prev.map(channel => 
          channel.name === randomTopic 
            ? { ...channel, messageCount: channel.messageCount + 1, lastMessage: new Date() }
            : channel
        ));
      }
    }, 3000);

    // Cleanup interval after component unmount
    return () => clearInterval(interval);
  }, [topics]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isConnected) {
      cleanup = startMessageSimulation();
    }
    return cleanup;
  }, [isConnected, startMessageSimulation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'RUNNING':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'FAILED':
        return 'bg-red-500';
      case 'FINISHED':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getComparisonIcon = (winner: string) => {
    switch (winner) {
      case 'kafka':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'webhook':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Confluent Cloud & AsyncAPI Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
            {!isConnected ? (
              <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Confluent Cloud'}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>

          {isConnected && (
            <Alert className="mt-4">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Connected to Confluent Cloud with Apache Kafka and Apache Flink support. 
                AsyncAPI integration active.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Tabs defaultValue="kafka" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="kafka">Kafka Topics</TabsTrigger>
            <TabsTrigger value="flink">Flink Jobs</TabsTrigger>
            <TabsTrigger value="ksql">ksqlDB</TabsTrigger>
            <TabsTrigger value="asyncapi">AsyncAPI</TabsTrigger>
            <TabsTrigger value="comparison">vs WebHooks</TabsTrigger>
          </TabsList>

          {/* Kafka Topics Tab */}
          <TabsContent value="kafka">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Topic Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Topic name"
                      value={newTopicName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTopicName(e.target.value)}
                    />
                    <Button onClick={handleCreateTopic}>Create Topic</Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Existing Topics</h4>
                    {topics.map((topic) => (
                      <div key={topic} className="flex items-center justify-between p-2 border rounded">
                        <span>{topic}</span>
                        <Badge variant="secondary">
                          {messages.filter(m => m.topic === topic).length} messages
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message Producer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select
                    title="Select Topic"
                    value={selectedTopic}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTopic(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>

                  <Textarea
                    placeholder='{"userId": 123, "action": "login", "timestamp": "2025-01-01T00:00:00Z"}'
                    value={messageToSend}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageToSend(e.target.value)}
                    rows={4}
                  />

                  <Button onClick={handleSendMessage} className="w-full">
                    Send Message with Kafka Transactions
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className="p-3 border rounded bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{message.topic}</Badge>
                          <span className="text-sm text-gray-500">
                            Partition {message.partition}, Offset {message.offset}
                          </span>
                        </div>
                        <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
                          {JSON.stringify(message.value, null, 2)}
                        </pre>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Flink Jobs Tab */}
          <TabsContent value="flink">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Apache Flink Stream Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Job name"
                    value={newJobName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewJobName(e.target.value)}
                  />

                  <Textarea
                    placeholder="SELECT user_id, COUNT(*) FROM user_events GROUP BY user_id"
                    value={newJobSql}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewJobSql(e.target.value)}
                    rows={4}
                  />

                  <Button onClick={handleSubmitFlinkJob} className="w-full">
                    Submit Flink Job
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Running Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {flinkJobs.map((job) => (
                      <div key={job.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{job.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            {job.status === 'RUNNING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStopFlinkJob(job.id)}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {job.metrics && (
                          <div className="text-sm text-gray-600">
                            <div>Processed: {job.metrics.processedRecords.toLocaleString()} records</div>
                            <div>Throughput: {job.metrics.throughputPerSecond}/sec</div>
                            <div>Latency: {job.metrics.latency}ms</div>
                          </div>
                        )}
                      </div>
                    ))}
                    {flinkJobs.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No Flink jobs running
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ksqlDB Tab */}
          <TabsContent value="ksql">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    ksqlDB Streaming SQL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="CREATE STREAM user_stream (user_id INT, action STRING) WITH (KAFKA_TOPIC='user-events', VALUE_FORMAT='JSON');"
                    value={newKsqlQuery}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewKsqlQuery(e.target.value)}
                    rows={6}
                  />

                  <Button onClick={handleExecuteKsqlQuery} className="w-full">
                    Execute ksqlDB Query
                  </Button>

                  <div className="space-y-2">
                    <h4 className="font-medium">Query History</h4>
                    {ksqlQueries.map((query, index) => (
                      <div key={`ksql-query-${index}-${query.slice(0, 20)}`} className="p-2 border rounded bg-gray-50">
                        <code className="text-sm">{query}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {queryResults.length > 0 ? (
                    <div className="space-y-2">
                      {queryResults.map((result, index) => (
                        <div key={`query-result-${index}-${JSON.stringify(result).slice(0, 20)}`} className="p-2 border rounded bg-white">
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Execute a query to see results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AsyncAPI Tab */}
          <TabsContent value="asyncapi">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    AsyncAPI Channels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asyncChannels.map((channel) => (
                      <div key={channel.name} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{channel.name}</span>
                          <Badge variant="secondary">
                            {channel.messageCount.toLocaleString()} messages
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Last message: {channel.lastMessage?.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AsyncAPI Specification</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
{`asyncapi: '2.6.0'
info:
  title: 'Azure Level 1 Event-Driven API'
  version: '1.0.0'
  description: 'Confluent Cloud Kafka integration'
servers:
  production:
    url: 'pkc-example.confluent.cloud:9092'
    protocol: 'kafka-secure'
channels:
  user-events:
    description: 'User activity events'
    subscribe:
      message:
        contentType: 'application/json'
        payload:
          type: object
          properties:
            userId: { type: integer }
            action: { type: string }
            timestamp: { type: string }
  order-events:
    description: 'E-commerce order events'
    subscribe:
      message:
        contentType: 'application/json'`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhook Comparison Tab */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Event-Driven Architecture: Kafka vs WebHooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Recommendation:</strong> Use Kafka for high-throughput, mission-critical events. 
                      Use WebHooks for simple integrations and external system notifications.
                    </AlertDescription>
                  </Alert>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-3 text-left">Feature</th>
                          <th className="border border-gray-300 p-3 text-left">Apache Kafka</th>
                          <th className="border border-gray-300 p-3 text-left">WebHooks</th>
                          <th className="border border-gray-300 p-3 text-center">Winner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhookComparison.map((comparison, index) => (
                          <tr key={`comparison-${comparison.feature.replace(/\s+/g, '-').toLowerCase()}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 p-3 font-medium">
                              {comparison.feature}
                            </td>
                            <td className="border border-gray-300 p-3">
                              {comparison.kafka}
                            </td>
                            <td className="border border-gray-300 p-3">
                              {comparison.webhook}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              {getComparisonIcon(comparison.winner)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">Kafka Advantages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>✅ Guaranteed message delivery with transactions</li>
                          <li>✅ Horizontal scalability to millions of messages/sec</li>
                          <li>✅ Built-in message replay and time-travel</li>
                          <li>✅ Strong ordering guarantees within partitions</li>
                          <li>✅ Schema evolution with Schema Registry</li>
                          <li>✅ Stream processing with ksqlDB and Flink</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-blue-600">WebHook Advantages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>✅ Simple HTTP-based integration</li>
                          <li>✅ No infrastructure setup required</li>
                          <li>✅ Easy debugging with HTTP tools</li>
                          <li>✅ Universal support across platforms</li>
                          <li>✅ Built-in authentication (API keys, signatures)</li>
                          <li>✅ Lower learning curve for developers</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}