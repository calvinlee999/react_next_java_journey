import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  BoltIcon,
  QueueListIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'WORKFLOW_STARTED' | 'TOOL_EXECUTED' | 'WORKFLOW_COMPLETED' | 'ERROR' | 'KAFKA_EVENT';
  domain: string;
  workflowId: string;
  message: string;
  metadata?: Record<string, unknown>;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface AgentMetrics {
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  avgExecutionTime: number;
  toolExecutions: number;
  kafkaEventsProcessed: number;
}

interface KafkaTopicMetrics {
  topic: string;
  messagesProduced: number;
  messagesConsumed: number;
  lag: number;
  throughput: number;
  status: 'healthy' | 'warning' | 'error';
}

const AgenticWorkflowMonitor: React.FC = () => {
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [kafkaMetrics, setKafkaMetrics] = useState<KafkaTopicMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const domains = ['ALL', 'user-management', 'journey-orchestration', 'ai-inference', 'data-products'];

  useEffect(() => {
    initializeMonitoring();
    startRealTimeUpdates();
    
    return () => {
      // Cleanup on unmount
      setIsConnected(false);
    };
  }, []);

  const initializeMonitoring = () => {
    // Initialize agent metrics
    const metrics: AgentMetrics = {
      activeWorkflows: 3,
      completedWorkflows: 127,
      failedWorkflows: 2,
      avgExecutionTime: 4.2,
      toolExecutions: 1250,
      kafkaEventsProcessed: 3420
    };

    // Initialize Kafka metrics
    const topics: KafkaTopicMetrics[] = [
      {
        topic: 'loan-application-events',
        messagesProduced: 450,
        messagesConsumed: 448,
        lag: 2,
        throughput: 12.5,
        status: 'healthy'
      },
      {
        topic: 'credit-decision-events',
        messagesProduced: 280,
        messagesConsumed: 280,
        lag: 0,
        throughput: 8.3,
        status: 'healthy'
      },
      {
        topic: 'fraud-detection-events',
        messagesProduced: 1200,
        messagesConsumed: 1195,
        lag: 5,
        throughput: 45.2,
        status: 'warning'
      },
      {
        topic: 'multi-domain-coordination',
        messagesProduced: 95,
        messagesConsumed: 95,
        lag: 0,
        throughput: 3.1,
        status: 'healthy'
      }
    ];

    // Initialize recent events
    const recentEvents: WorkflowEvent[] = [
      {
        id: 'EVT-001',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        type: 'WORKFLOW_STARTED',
        domain: 'journey-orchestration',
        workflowId: 'WF-LOAN-2025-045',
        message: 'Loan application workflow started for customer SA-12345',
        status: 'info',
        metadata: { customerId: 'SA-12345', amount: 250000 }
      },
      {
        id: 'EVT-002',
        timestamp: new Date(Date.now() - 25000).toISOString(),
        type: 'TOOL_EXECUTED',
        domain: 'user-management',
        workflowId: 'WF-LOAN-2025-045',
        message: 'MCP tool get_user_profile executed successfully',
        status: 'success',
        metadata: { tool: 'get_user_profile', duration: 1.8 }
      },
      {
        id: 'EVT-003',
        timestamp: new Date(Date.now() - 20000).toISOString(),
        type: 'KAFKA_EVENT',
        domain: 'journey-orchestration',
        workflowId: 'WF-LOAN-2025-045',
        message: 'Published USER_VALIDATED event to Kafka',
        status: 'info',
        metadata: { topic: 'loan-application-events', partition: 0 }
      },
      {
        id: 'EVT-004',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        type: 'TOOL_EXECUTED',
        domain: 'ai-inference',
        workflowId: 'WF-LOAN-2025-045',
        message: 'MCP tool detect_transaction_fraud executed successfully',
        status: 'success',
        metadata: { tool: 'detect_transaction_fraud', duration: 3.2, riskScore: 0.15 }
      },
      {
        id: 'EVT-005',
        timestamp: new Date(Date.now() - 10000).toISOString(),
        type: 'WORKFLOW_COMPLETED',
        domain: 'journey-orchestration',
        workflowId: 'WF-LOAN-2025-045',
        message: 'Loan application workflow completed successfully',
        status: 'success',
        metadata: { totalDuration: 18.5, approved: true, finalAmount: 250000 }
      }
    ];

    setAgentMetrics(metrics);
    setKafkaMetrics(topics);
    setWorkflowEvents(recentEvents);
    setIsConnected(true);
  };

  const startRealTimeUpdates = () => {
    // Simulate real-time workflow events
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addNewWorkflowEvent();
      }
      updateMetrics();
    }, 3000);

    return () => clearInterval(interval);
  };

  const addNewWorkflowEvent = () => {
    const eventTypes: WorkflowEvent['type'][] = [
      'WORKFLOW_STARTED', 'TOOL_EXECUTED', 'WORKFLOW_COMPLETED', 'KAFKA_EVENT'
    ];
    
    const domains = ['user-management', 'journey-orchestration', 'ai-inference', 'data-products'];
    const tools = ['get_user_profile', 'detect_transaction_fraud', 'assess_credit_risk', 'get_customer_behavior_analytics'];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    let message = '';
    let status: WorkflowEvent['status'] = 'info';
    let metadata: Record<string, unknown> = {};

    switch (eventType) {
      case 'WORKFLOW_STARTED':
        message = `New workflow started in ${domain} domain`;
        status = 'info';
        metadata = { workflowType: 'automated', trigger: 'agent' };
        break;
      case 'TOOL_EXECUTED':
        const tool = tools[Math.floor(Math.random() * tools.length)];
        message = `MCP tool ${tool} executed`;
        status = Math.random() > 0.9 ? 'warning' : 'success';
        metadata = { tool, duration: Math.random() * 5 + 1 };
        break;
      case 'WORKFLOW_COMPLETED':
        message = `Workflow completed in ${domain} domain`;
        status = Math.random() > 0.95 ? 'error' : 'success';
        metadata = { totalDuration: Math.random() * 20 + 5 };
        break;
      case 'KAFKA_EVENT':
        message = `Event published to Kafka topic`;
        status = 'info';
        metadata = { topic: `${domain}-events`, partition: Math.floor(Math.random() * 3) };
        break;
    }

    const newEvent: WorkflowEvent = {
      id: `EVT-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      type: eventType,
      domain,
      workflowId: `WF-${Date.now()}`,
      message,
      status,
      metadata
    };

    setWorkflowEvents(prev => [newEvent, ...prev.slice(0, 49)]);
  };

  const updateMetrics = () => {
    setAgentMetrics(prev => prev ? {
      ...prev,
      activeWorkflows: Math.max(0, prev.activeWorkflows + Math.floor(Math.random() * 3) - 1),
      completedWorkflows: prev.completedWorkflows + (Math.random() > 0.7 ? 1 : 0),
      toolExecutions: prev.toolExecutions + Math.floor(Math.random() * 3),
      kafkaEventsProcessed: prev.kafkaEventsProcessed + Math.floor(Math.random() * 5)
    } : null);

    setKafkaMetrics(prev => prev.map(topic => ({
      ...topic,
      messagesProduced: topic.messagesProduced + Math.floor(Math.random() * 3),
      messagesConsumed: topic.messagesConsumed + Math.floor(Math.random() * 3),
      lag: Math.max(0, topic.lag + Math.floor(Math.random() * 3) - 1),
      throughput: Math.max(0, topic.throughput + Math.random() * 2 - 1)
    })));
  };

  const getEventIcon = (type: WorkflowEvent['type']) => {
    switch (type) {
      case 'WORKFLOW_STARTED':
        return <CogIcon className="h-5 w-5 text-blue-500" />;
      case 'TOOL_EXECUTED':
        return <BoltIcon className="h-5 w-5 text-green-500" />;
      case 'WORKFLOW_COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'KAFKA_EVENT':
        return <QueueListIcon className="h-5 w-5 text-purple-500" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getKafkaStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredEvents = selectedDomain === 'ALL' 
    ? workflowEvents 
    : workflowEvents.filter(event => event.domain === selectedDomain);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agentic Workflow Monitor</h2>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of AI agent workflows and Kafka events
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Metrics */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Metrics</h3>
          
          {agentMetrics && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Workflow Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Workflows</span>
                    <span className="text-lg font-bold text-blue-600">{agentMetrics.activeWorkflows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-lg font-bold text-green-600">{agentMetrics.completedWorkflows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="text-lg font-bold text-red-600">{agentMetrics.failedWorkflows}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Execution Time</span>
                    <span className="text-lg font-bold text-gray-900">{agentMetrics.avgExecutionTime}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tool Executions</span>
                    <span className="text-lg font-bold text-gray-900">{agentMetrics.toolExecutions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kafka Events</span>
                    <span className="text-lg font-bold text-gray-900">{agentMetrics.kafkaEventsProcessed}</span>
                  </div>
                </div>
              </div>

              {/* Kafka Topics */}
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Kafka Topics</h4>
                <div className="space-y-3">
                  {kafkaMetrics.map(topic => (
                    <div key={topic.topic} className="border-l-4 pl-3" style={{ borderLeftColor: topic.status === 'healthy' ? '#10b981' : topic.status === 'warning' ? '#f59e0b' : '#ef4444' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">{topic.topic}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKafkaStatusColor(topic.status)}`}>
                          {topic.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-xs text-gray-600">
                          Produced: {topic.messagesProduced}
                        </div>
                        <div className="text-xs text-gray-600">
                          Consumed: {topic.messagesConsumed}
                        </div>
                        <div className="text-xs text-gray-600">
                          Lag: {topic.lag}
                        </div>
                        <div className="text-xs text-gray-600">
                          {topic.throughput.toFixed(1)} msg/s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Events */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Real-time Events ({filteredEvents.length})
          </h3>
          
          <div className="bg-white rounded-lg shadow-sm border max-h-96 overflow-y-auto">
            {filteredEvents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.type.replace('_', ' ')}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {event.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Domain: <span className="font-medium">{event.domain}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            Workflow: <span className="font-medium">{event.workflowId}</span>
                          </span>
                        </div>
                        
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                              View metadata
                            </summary>
                            <pre className="text-xs text-gray-700 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <SignalIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No events found for the selected domain</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-gray-900 rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-white mb-3">
          🚀 Agentic System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">MCP Framework</h4>
            <p className="text-xs text-gray-400 mt-1">Java SDK with Spring AI integration</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Kafka Integration</h4>
            <p className="text-xs text-gray-400 mt-1">Event-driven workflow coordination</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Agent Intelligence</h4>
            <p className="text-xs text-gray-400 mt-1">Workflow planning and execution</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Domain Coordination</h4>
            <p className="text-xs text-gray-400 mt-1">Multi-domain workflow orchestration</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgenticWorkflowMonitor;