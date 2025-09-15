import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  DocumentChartBarIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import CustomerJourneyDemo from '../../components/mcp-demo/CustomerJourneyDemo';
import RiskManagementDemo from '../../components/mcp-demo/RiskManagementDemo';
import DataInsightsDemo from '../../components/mcp-demo/DataInsightsDemo';
import AgenticWorkflowMonitor from '../../components/mcp-demo/AgenticWorkflowMonitor';

type DemoSection = 'journey' | 'risk' | 'insights' | 'monitor';

interface McpServerStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  tools: number;
  lastUpdate: string;
}

const McpDemoPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DemoSection>('journey');
  const [isAgenticMode, setIsAgenticMode] = useState(false);

  // Mock MCP server statuses
  const mcpServers: McpServerStatus[] = [
    { name: 'User Management', status: 'online', tools: 8, lastUpdate: '2 min ago' },
    { name: 'Journey Orchestrator', status: 'online', tools: 12, lastUpdate: '1 min ago' },
    { name: 'AI Inference', status: 'online', tools: 6, lastUpdate: '30 sec ago' },
    { name: 'Data Products', status: 'online', tools: 9, lastUpdate: '1 min ago' },
  ];

  const sections = [
    {
      id: 'journey' as DemoSection,
      title: 'Customer Journey Automation',
      icon: CogIcon,
      description: 'Intelligent loan application workflows with multi-domain coordination',
      color: 'bg-blue-500'
    },
    {
      id: 'risk' as DemoSection,
      title: 'Real-time Risk Management',
      icon: ShieldCheckIcon,
      description: 'Fraud detection, credit scoring, and portfolio risk monitoring',
      color: 'bg-red-500'
    },
    {
      id: 'insights' as DemoSection,
      title: 'Data-Driven Insights',
      icon: DocumentChartBarIcon,
      description: 'Customer analytics, transaction insights, and behavioral patterns',
      color: 'bg-green-500'
    },
    {
      id: 'monitor' as DemoSection,
      title: 'Agentic Workflow Monitor',
      icon: ChartBarIcon,
      description: 'Real-time monitoring of AI agent workflows and Kafka events',
      color: 'bg-purple-500'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'journey':
        return <CustomerJourneyDemo isAgenticMode={isAgenticMode} />;
      case 'risk':
        return <RiskManagementDemo isAgenticMode={isAgenticMode} />;
      case 'insights':
        return <DataInsightsDemo isAgenticMode={isAgenticMode} />;
      case 'monitor':
        return <AgenticWorkflowMonitor />;
      default:
        return <CustomerJourneyDemo isAgenticMode={isAgenticMode} />;
    }
  };

  return (
    <>
      <Head>
        <title>MCP FinTech Demo - Agentic Automation Platform</title>
        <meta name="description" content="Model Context Protocol FinTech demonstration with intelligent workflow automation" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  MCP FinTech Demo
                </h1>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Agentic Automation Platform
                </span>
              </div>
              
              {/* Agentic Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 mr-3">
                    Agentic Mode
                  </label>
                  <button
                    onClick={() => setIsAgenticMode(!isAgenticMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isAgenticMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAgenticMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {isAgenticMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-1"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">AI Agents Active</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Sections</h2>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-gray-600 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {section.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                {/* MCP Server Status */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">MCP Server Status</h3>
                  <div className="space-y-2">
                    {mcpServers.map((server) => (
                      <div key={server.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          {getStatusIcon(server.status)}
                          <span className="ml-2 text-xs font-medium text-gray-700">
                            {server.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{server.tools} tools</div>
                          <div className="text-xs text-gray-400">{server.lastUpdate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm"
              >
                {renderActiveSection()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default McpDemoPage;