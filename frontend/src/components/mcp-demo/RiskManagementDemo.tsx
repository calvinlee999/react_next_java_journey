import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface RiskManagementDemoProps {
  isAgenticMode: boolean;
}

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
  description: string;
}

interface FraudAlert {
  id: string;
  type: 'transaction' | 'account' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  amount?: number;
  customer: string;
  timestamp: string;
  status: 'investigating' | 'resolved' | 'false_positive';
  mcpTool: string;
}

interface PortfolioRisk {
  totalValue: number;
  var95: number;
  expectedLoss: number;
  concentrationRisk: number;
  sectors: { name: string; exposure: number; risk: number }[];
}

const RiskManagementDemo: React.FC<RiskManagementDemoProps> = ({ isAgenticMode }) => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRisk | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  // Initialize data
  useEffect(() => {
    initializeRiskData();
    if (isAgenticMode) {
      startRealTimeMonitoring();
    }
  }, [isAgenticMode]);

  const initializeRiskData = () => {
    const initialMetrics: RiskMetric[] = [
      {
        id: 'credit_risk',
        name: 'Credit Risk Score',
        value: 0.23,
        threshold: 0.30,
        status: 'safe',
        trend: 'down',
        unit: '%',
        description: 'Overall portfolio credit risk'
      },
      {
        id: 'fraud_rate',
        name: 'Fraud Detection Rate',
        value: 0.015,
        threshold: 0.05,
        status: 'safe',
        trend: 'stable',
        unit: '%',
        description: 'Real-time fraud detection rate'
      },
      {
        id: 'market_risk',
        name: 'Market Risk VaR',
        value: 2.8,
        threshold: 5.0,
        status: 'safe',
        trend: 'up',
        unit: 'M$',
        description: '95% Value at Risk (daily)'
      },
      {
        id: 'operational_risk',
        name: 'Operational Risk',
        value: 0.08,
        threshold: 0.15,
        status: 'warning',
        trend: 'up',
        unit: '%',
        description: 'Process and system risk exposure'
      }
    ];

    const initialAlerts: FraudAlert[] = [
      {
        id: 'ALERT-001',
        type: 'transaction',
        severity: 'high',
        description: 'Unusual large transaction detected',
        amount: 85000,
        customer: 'John Doe',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        status: 'investigating',
        mcpTool: 'detect_transaction_fraud'
      },
      {
        id: 'ALERT-002',
        type: 'pattern',
        severity: 'medium',
        description: 'Velocity pattern anomaly detected',
        customer: 'Sarah Smith',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        status: 'investigating',
        mcpTool: 'analyze_behavior_pattern'
      },
      {
        id: 'ALERT-003',
        type: 'account',
        severity: 'low',
        description: 'Multiple login attempts from new location',
        customer: 'Mike Johnson',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        status: 'resolved',
        mcpTool: 'validate_user_access'
      }
    ];

    const initialPortfolio: PortfolioRisk = {
      totalValue: 125000000,
      var95: 2800000,
      expectedLoss: 185000,
      concentrationRisk: 0.15,
      sectors: [
        { name: 'Technology', exposure: 35, risk: 0.18 },
        { name: 'Finance', exposure: 25, risk: 0.12 },
        { name: 'Healthcare', exposure: 20, risk: 0.08 },
        { name: 'Real Estate', exposure: 15, risk: 0.22 },
        { name: 'Energy', exposure: 5, risk: 0.35 }
      ]
    };

    setRiskMetrics(initialMetrics);
    setFraudAlerts(initialAlerts);
    setPortfolioRisk(initialPortfolio);
  };

  const startRealTimeMonitoring = () => {
    setIsMonitoring(true);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update risk metrics
      setRiskMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 0.02),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })));

      // Occasionally add new fraud alerts
      if (Math.random() > 0.85) {
        const newAlert: FraudAlert = {
          id: `ALERT-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
          type: ['transaction', 'account', 'pattern'][Math.floor(Math.random() * 3)] as any,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          description: 'Real-time anomaly detected by AI agent',
          amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100000) : undefined,
          customer: 'Live Customer',
          timestamp: new Date().toISOString(),
          status: 'investigating',
          mcpTool: 'real_time_fraud_detection'
        };
        
        setFraudAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleInvestigateAlert = async (alert: FraudAlert) => {
    setSelectedAlert(alert);
    
    if (isAgenticMode) {
      // Simulate AI agent investigation
      setTimeout(() => {
        setFraudAlerts(prev => prev.map(a => 
          a.id === alert.id 
            ? { ...a, status: 'resolved' as const }
            : a
        ));
        setSelectedAlert(null);
      }, 2000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-time Risk Management</h2>
          <p className="text-gray-600 mt-1">
            AI-powered fraud detection, credit scoring, and portfolio risk monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {isMonitoring && (
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live Monitoring</span>
            </div>
          )}
          
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Metrics */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {riskMetrics.map((metric) => (
              <motion.div
                key={metric.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {metric.value.toFixed(metric.unit === '%' ? 3 : 1)}{metric.unit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status.toUpperCase()}
                    </span>
                    <div className="flex items-center mt-2">
                      {metric.trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-red-500" />
                      ) : metric.trend === 'down' ? (
                        <ArrowDownIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.value / metric.threshold > 0.8 ? 'bg-red-500' :
                        metric.value / metric.threshold > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (metric.value / metric.threshold) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Threshold: {metric.threshold}{metric.unit}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Portfolio Risk */}
          {portfolioRisk && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Risk Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(portfolioRisk.totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">VaR 95%</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(portfolioRisk.var95 / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Loss</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(portfolioRisk.expectedLoss / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Concentration Risk</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(portfolioRisk.concentrationRisk * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Sector Exposure</h5>
                <div className="space-y-2">
                  {portfolioRisk.sectors.map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{sector.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{sector.exposure}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              sector.risk > 0.3 ? 'bg-red-500' :
                              sector.risk > 0.15 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${sector.exposure}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fraud Alerts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Alerts</h3>
          <div className="space-y-3">
            {fraudAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-lg shadow-sm border-l-4"
                style={{
                  borderLeftColor: 
                    alert.severity === 'high' ? '#ef4444' :
                    alert.severity === 'medium' ? '#f59e0b' : '#10b981'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.id}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Customer: {alert.customer}</p>
                      {alert.amount && (
                        <p className="text-xs text-gray-500">Amount: ${alert.amount.toLocaleString()}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">MCP: {alert.mcpTool}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  {alert.status === 'investigating' && (
                    <button
                      onClick={() => handleInvestigateAlert(alert)}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {isAgenticMode ? 'AI Investigate' : 'Investigate'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* MCP Tool Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-gray-900 rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-white mb-3">
          {isAgenticMode ? '🤖 Active MCP Risk Tools' : '🔧 Available MCP Risk Tools'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">detect_transaction_fraud</h4>
            <p className="text-xs text-gray-400 mt-1">Real-time fraud detection analysis</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">assess_credit_risk</h4>
            <p className="text-xs text-gray-400 mt-1">Credit scoring and risk assessment</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">analyze_portfolio_risk</h4>
            <p className="text-xs text-gray-400 mt-1">Portfolio risk analysis and monitoring</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RiskManagementDemo;