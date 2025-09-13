'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type InferenceMode = 'real-time' | 'near-real-time' | 'batch';

interface InferenceResult {
  id: string;
  mode: InferenceMode;
  prompt: string;
  response: string;
  latency: number;
  timestamp: number;
  cost: number;
  throughput?: number;
  batchSize?: number;
}

interface LiveMetrics {
  totalRequests: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  networkThroughput: number;
}

export default function AIInferenceDemoPage() {
  const [selectedMode, setSelectedMode] = useState<InferenceMode>('real-time');
  const [prompt, setPrompt] = useState('Explain the benefits of microservices architecture');
  const [results, setResults] = useState<InferenceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    totalRequests: 0,
    activeConnections: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    networkThroughput: 0
  });
  const [batchProgress, setBatchProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const modeConfigs = {
    'real-time': {
      title: '🚀 Real-Time Inference',
      description: 'Sub-100ms latency for interactive applications',
      port: 8082,
      features: ['Interactive Chat', 'Live Recommendations', 'Instant Personalization'],
      metrics: { latency: '25-100ms', throughput: '10K req/s', cost: '$$$' }
    },
    'near-real-time': {
      title: '⚡ Near-Real-Time Inference', 
      description: '500ms micro-batch processing for streaming analytics',
      port: 8086,
      features: ['Fraud Detection', 'Content Moderation', 'Streaming Analytics'],
      metrics: { latency: '500ms-1s', throughput: '50K req/s', cost: '$$' }
    },
    'batch': {
      title: '📊 Batch Inference',
      description: 'High-throughput processing for large datasets',
      port: 8086,
      features: ['ETL Pipelines', 'Model Training', 'Bulk Processing'],
      metrics: { latency: '5min-1hr', throughput: '1M+ rec/hr', cost: '$' }
    }
  } as const;

  const generateMockResult = (mode: InferenceMode): InferenceResult => {
    const getLatency = (modeType: InferenceMode) => {
      switch (modeType) {
        case 'real-time': return Math.random() * 75 + 25;
        case 'near-real-time': return Math.random() * 500 + 500;
        case 'batch': return Math.random() * 30000 + 300000;
        default: return 100;
      }
    };

    const getCost = (modeType: InferenceMode) => {
      switch (modeType) {
        case 'real-time': return Math.random() * 0.002 + 0.008;
        case 'near-real-time': return Math.random() * 0.001 + 0.003;
        case 'batch': return Math.random() * 0.0005 + 0.0005;
        default: return 0.005;
      }
    };

    const responses = [
      'Microservices architecture provides improved scalability, fault isolation, and technology diversity.',
      'Key benefits include independent deployment, better team autonomy, and enhanced resilience.',
      'The architecture enables faster development cycles and easier maintenance of complex applications.',
      'Microservices offer better resource utilization and support for different programming languages.'
    ];

    return {
      id: Date.now().toString(),
      mode,
      prompt,
      response: responses[Math.floor(Math.random() * responses.length)],
      latency: getLatency(mode),
      timestamp: Date.now(),
      cost: getCost(mode),
      throughput: mode === 'near-real-time' ? Math.random() * 20000 + 30000 : undefined,
      batchSize: mode === 'batch' ? Math.floor(Math.random() * 50000) + 10000 : undefined
    };
  };

  const simulateInference = async () => {
    setIsLoading(true);

    if (selectedMode === 'batch') {
      setBatchProgress(0);
      const progressInterval = setInterval(() => {
        setBatchProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      setTimeout(() => {
        clearInterval(progressInterval);
        setBatchProgress(100);
        const result = generateMockResult(selectedMode);
        setResults(prev => [result, ...prev.slice(0, 9)]);
        setIsLoading(false);
      }, 3000);
    } else {
      setTimeout(() => {
        const result = generateMockResult(selectedMode);
        setResults(prev => [result, ...prev.slice(0, 9)]);
        setIsLoading(false);
        if (selectedMode === 'near-real-time') {
          setBatchProgress(100);
        }
      }, selectedMode === 'real-time' ? Math.random() * 100 + 50 : Math.random() * 800 + 500);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLiveMetrics({
        totalRequests: Math.floor(Math.random() * 50000) + 100000,
        activeConnections: Math.floor(Math.random() * 500) + 1000,
        cpuUsage: Math.random() * 30 + 40,
        memoryUsage: Math.random() * 20 + 60,
        networkThroughput: Math.random() * 500 + 800
      });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-600';
    if (latency < 1000) return 'text-blue-600';
    return 'text-purple-600';
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency.toFixed(0)}ms`;
    if (latency < 60000) return `${(latency / 1000).toFixed(1)}s`;
    return `${(latency / 60000).toFixed(1)}min`;
  };

  const getProgressWidth = (progress: number) => {
    if (progress < 25) return 'w-1/4';
    if (progress < 50) return 'w-2/4';
    if (progress < 75) return 'w-3/4';
    return 'w-full';
  };

  const handleModeSelect = (mode: InferenceMode) => {
    setSelectedMode(mode);
  };

  const handleKeyDown = (event: React.KeyboardEvent, mode: InferenceMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeSelect(mode);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧠 AI Inference Modes Comparison
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience real-time, near-real-time, and batch AI inference capabilities with live performance metrics
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">🎮 Interactive Demo</TabsTrigger>
          <TabsTrigger value="metrics">📊 Performance Metrics</TabsTrigger>
          <TabsTrigger value="architecture">🏗️ Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          {/* Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(modeConfigs).map(([mode, config]) => (
              <button
                key={mode}
                type="button"
                className={`cursor-pointer transition-all duration-200 rounded-lg text-left ${
                  selectedMode === mode ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => handleModeSelect(mode as InferenceMode)}
                onKeyDown={(e) => handleKeyDown(e, mode as InferenceMode)}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full justify-center">
                        Port: {config.port}
                      </Badge>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Latency:</span>
                          <span className="font-mono">{config.metrics.latency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Throughput:</span>
                          <span className="font-mono">{config.metrics.throughput}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-mono">{config.metrics.cost}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {/* Inference Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ AI Inference Testing
              </CardTitle>
              <p className="text-gray-600">
                Test {modeConfigs[selectedMode].title} with your custom prompt
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your AI prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <Button 
                  onClick={simulateInference}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      ⚡ Run {modeConfigs[selectedMode].title}
                    </>
                  )}
                </Button>
                <Badge variant="secondary" className="flex items-center gap-1">
                  📊 {selectedMode.replace('-', ' ')} mode
                </Badge>
              </div>

              {selectedMode === 'batch' && isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Batch Processing Progress</span>
                    <span>{batchProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <div 
                      className={`bg-blue-600 h-2 rounded-full transition-all duration-300 absolute left-0 top-0 ${getProgressWidth(batchProgress)}`}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗄️ Inference Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No results yet. Run an inference to see results here.
                  </p>
                ) : (
                  results.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="capitalize">
                          {result.mode.replace('-', ' ')}
                        </Badge>
                        <div className="text-right text-sm text-gray-500">
                          <div className={`font-mono ${getLatencyColor(result.latency)}`}>
                            {formatLatency(result.latency)}
                          </div>
                          <div>${result.cost.toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-1">Prompt:</div>
                        <div className="text-gray-600 mb-2">{result.prompt}</div>
                        <div className="font-medium mb-1">Response:</div>
                        <div className="text-gray-800">{result.response}</div>
                      </div>
                      {result.throughput && (
                        <div className="text-xs text-gray-500">
                          Throughput: {result.throughput.toLocaleString()} req/s
                        </div>
                      )}
                      {result.batchSize && (
                        <div className="text-xs text-gray-500">
                          Batch Size: {result.batchSize.toLocaleString()} records
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Live System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  👥
                  <div>
                    <div className="text-sm text-gray-500">Active Users</div>
                    <div className="text-xl font-bold">{liveMetrics.activeConnections?.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  📊
                  <div>
                    <div className="text-sm text-gray-500">Total Requests</div>
                    <div className="text-xl font-bold">{liveMetrics.totalRequests?.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  💾
                  <div>
                    <div className="text-sm text-gray-500">CPU Usage</div>
                    <div className="text-xl font-bold">{liveMetrics.cpuUsage?.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  🗄️
                  <div>
                    <div className="text-sm text-gray-500">Memory</div>
                    <div className="text-xl font-bold">{liveMetrics.memoryUsage?.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  🌐
                  <div>
                    <div className="text-sm text-gray-500">Network</div>
                    <div className="text-xl font-bold">{liveMetrics.networkThroughput?.toFixed(0)} MB/s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(modeConfigs).map(([mode, config]) => (
                  <div key={mode} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{config.title}</h3>
                      <Badge variant="outline">Port {config.port}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Latency:</span>
                        <div className="font-mono font-semibold">{config.metrics.latency}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Throughput:</span>
                        <div className="font-mono font-semibold">{config.metrics.throughput}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <div className="font-mono font-semibold">{config.metrics.cost}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Inference Architecture</CardTitle>
              <p className="text-gray-600">
                Complete overview of our three-tier AI inference system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Architecture Diagram */}
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-semibold mb-4">System Architecture</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-green-600 text-2xl mb-2">🚀</div>
                      <h4 className="font-semibold">Real-Time</h4>
                      <p className="text-sm text-gray-600">Direct API calls with Redis caching</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-blue-600 text-2xl mb-2">⚡</div>
                      <h4 className="font-semibold">Near-Real-Time</h4>
                      <p className="text-sm text-gray-600">Kafka + Spark Streaming</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-purple-600 text-2xl mb-2">📊</div>
                      <h4 className="font-semibold">Batch</h4>
                      <p className="text-sm text-gray-600">Apache Spark + Azure Databricks</p>
                    </div>
                  </div>
                </div>

                {/* Feature Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(modeConfigs).map(([mode, config]) => (
                    <Card key={mode}>
                      <CardHeader>
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">Key Features:</h4>
                            <ul className="text-sm space-y-1">
                              {config.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Technology Stack:</h4>
                            <Badge variant="outline" className="text-xs">
                              Port {config.port}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Documentation Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>📚 Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href="/docs/ai-inference-architecture" className="block p-4 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium">🏗️ Architecture Guide</h4>
                        <p className="text-sm text-gray-600">Detailed architecture documentation</p>
                      </a>
                      <a href="/docs/performance-tuning" className="block p-4 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium">⚡ Performance Tuning</h4>
                        <p className="text-sm text-gray-600">Optimization strategies and best practices</p>
                      </a>
                      <a href="/docs/api-reference" className="block p-4 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium">📖 API Reference</h4>
                        <p className="text-sm text-gray-600">Complete API documentation</p>
                      </a>
                      <a href="/docs/deployment" className="block p-4 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium">🚀 Deployment Guide</h4>
                        <p className="text-sm text-gray-600">Production deployment instructions</p>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}