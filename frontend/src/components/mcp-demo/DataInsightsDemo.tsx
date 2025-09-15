import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface DataInsightsDemoProps {
  isAgenticMode: boolean;
}

interface CustomerAnalytics {
  segment: string;
  customerCount: number;
  avgTransactionVolume: number;
  avgRiskScore: number;
  engagementRate: number;
  churnProbability: number;
  trendingProducts: string[];
  riskDistribution: { low: number; medium: number; high: number };
}

interface TransactionInsights {
  timeWindow: number;
  totalCount: number;
  totalAmount: number;
  avgAmount: number;
  peakHour: number;
  distribution: { payments: number; transfers: number; loans: number };
  anomaliesDetected: number;
  successRate: number;
}

interface DataProduct {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'processing' | 'error';
  lastUpdated: string;
  dataQuality: number;
  mcpTool: string;
}

const DataInsightsDemo: React.FC<DataInsightsDemoProps> = ({ isAgenticMode }) => {
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [transactionInsights, setTransactionInsights] = useState<TransactionInsights | null>(null);
  const [dataProducts, setDataProducts] = useState<DataProduct[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [timeWindow, setTimeWindow] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(false);

  const segments = ['ALL', 'PREMIUM', 'STANDARD', 'BASIC'];

  useEffect(() => {
    loadDataProducts();
    fetchCustomerAnalytics(selectedSegment);
    fetchTransactionInsights(timeWindow);
  }, [selectedSegment, timeWindow]);

  const loadDataProducts = () => {
    const products: DataProduct[] = [
      {
        id: 'customer-behavior',
        name: 'Customer Behavior Analytics',
        description: 'Customer segmentation and behavior insights',
        status: 'active',
        lastUpdated: '2 min ago',
        dataQuality: 0.95,
        mcpTool: 'get_customer_behavior_analytics'
      },
      {
        id: 'risk-metrics',
        name: 'Risk Metrics Data Product',
        description: 'Portfolio risk and compliance indicators',
        status: 'active',
        lastUpdated: '1 min ago',
        dataQuality: 0.92,
        mcpTool: 'get_risk_metrics_data_product'
      },
      {
        id: 'transaction-insights',
        name: 'Transaction Insights Stream',
        description: 'Real-time transaction monitoring and analysis',
        status: 'processing',
        lastUpdated: '30 sec ago',
        dataQuality: 0.97,
        mcpTool: 'get_transaction_insights_stream'
      }
    ];
    setDataProducts(products);
  };

  const fetchCustomerAnalytics = async (segment: string) => {
    setIsLoading(true);
    
    // Simulate API call with MCP tool
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const analytics: CustomerAnalytics = {
      segment,
      customerCount: getCustomerCountForSegment(segment),
      avgTransactionVolume: 15000.50 + Math.random() * 5000,
      avgRiskScore: 0.23 + Math.random() * 0.1,
      engagementRate: 0.78 + Math.random() * 0.1,
      churnProbability: 0.12 + Math.random() * 0.05,
      trendingProducts: ['personal_loans', 'credit_cards', 'investment_accounts'],
      riskDistribution: {
        low: 0.65 + Math.random() * 0.1,
        medium: 0.25 + Math.random() * 0.05,
        high: 0.10 + Math.random() * 0.03
      }
    };
    
    setCustomerAnalytics(analytics);
    setIsLoading(false);
  };

  const fetchTransactionInsights = async (minutes: number) => {
    // Simulate real-time transaction insights
    const insights: TransactionInsights = {
      timeWindow: minutes,
      totalCount: 15420 + Math.floor(Math.random() * 1000),
      totalAmount: 12500000.75 + Math.random() * 1000000,
      avgAmount: 810.23 + Math.random() * 100,
      peakHour: 14,
      distribution: {
        payments: 0.65,
        transfers: 0.25,
        loans: 0.10
      },
      anomaliesDetected: Math.floor(Math.random() * 5),
      successRate: 0.998 + Math.random() * 0.002
    };
    
    setTransactionInsights(insights);
  };

  const getCustomerCountForSegment = (segment: string): number => {
    const counts: Record<string, number> = {
      'PREMIUM': 5420,
      'STANDARD': 28750,
      'BASIC': 45200,
      'ALL': 79370
    };
    return counts[segment] || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const generateDataInsight = async (productId: string) => {
    setIsLoading(true);
    
    // Update product status to processing
    setDataProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, status: 'processing' as const }
        : product
    ));

    // Simulate AI agent generating insights
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update product status back to active
    setDataProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product, 
            status: 'active' as const, 
            lastUpdated: 'just now',
            dataQuality: Math.min(0.99, product.dataQuality + 0.01)
          }
        : product
    ));

    // Refresh data based on product type
    if (productId === 'customer-behavior') {
      await fetchCustomerAnalytics(selectedSegment);
    } else if (productId === 'transaction-insights') {
      await fetchTransactionInsights(timeWindow);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data-Driven Insights</h2>
          <p className="text-gray-600 mt-1">
            Customer analytics, transaction insights, and behavioral patterns from data mesh
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {segments.map(segment => (
              <option key={segment} value={segment}>{segment}</option>
            ))}
          </select>
          
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={240}>4 hours</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Products */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Products</h3>
          <div className="space-y-4">
            {dataProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <p className="text-xs text-blue-600 mt-1">MCP: {product.mcpTool}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {product.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Data Quality: {(product.dataQuality * 100).toFixed(1)}%</span>
                    <span>{product.lastUpdated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${product.dataQuality * 100}%` }}
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => generateDataInsight(product.id)}
                  disabled={isLoading || product.status === 'processing'}
                  className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isAgenticMode ? '🤖 AI Generate Insights' : 'Generate Insights'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Customer Analytics */}
            {customerAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Customer Analytics - {customerAnalytics.segment} Segment
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {customerAnalytics.customerCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Customers</p>
                  </div>
                  
                  <div className="text-center">
                    <CreditCardIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      ${(customerAnalytics.avgTransactionVolume).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Transaction</p>
                  </div>
                  
                  <div className="text-center">
                    <ChartBarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {(customerAnalytics.avgRiskScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Risk Score</p>
                  </div>
                  
                  <div className="text-center">
                    <TrendingUpIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {(customerAnalytics.engagementRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Engagement</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Low Risk</span>
                        <span className="text-sm font-medium">{(customerAnalytics.riskDistribution.low * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${customerAnalytics.riskDistribution.low * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Medium Risk</span>
                        <span className="text-sm font-medium">{(customerAnalytics.riskDistribution.medium * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{ width: `${customerAnalytics.riskDistribution.medium * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">High Risk</span>
                        <span className="text-sm font-medium">{(customerAnalytics.riskDistribution.high * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-red-500 rounded-full"
                          style={{ width: `${customerAnalytics.riskDistribution.high * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Trending Products</h4>
                    <div className="space-y-2">
                      {customerAnalytics.trendingProducts.map((product, index) => (
                        <div key={product} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {product.replace('_', ' ')}
                          </span>
                          <TrendingUpIcon className="h-4 w-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <TrendingDownIcon className="h-4 w-4 inline mr-1" />
                        Churn Risk: {(customerAnalytics.churnProbability * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transaction Insights */}
            {transactionInsights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Transaction Insights - Last {transactionInsights.timeWindow} Minutes
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {transactionInsights.totalCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${(transactionInsights.totalAmount / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-gray-600">Total Volume</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${transactionInsights.avgAmount.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Amount</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {(transactionInsights.successRate * 100).toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Transaction Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payments</span>
                        <span className="text-sm font-medium">{(transactionInsights.distribution.payments * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${transactionInsights.distribution.payments * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transfers</span>
                        <span className="text-sm font-medium">{(transactionInsights.distribution.transfers * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${transactionInsights.distribution.transfers * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Loans</span>
                        <span className="text-sm font-medium">{(transactionInsights.distribution.loans * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${transactionInsights.distribution.loans * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Activity Patterns</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Peak Hour</span>
                        <span className="text-sm font-medium">{transactionInsights.peakHour}:00</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Anomalies Detected</span>
                        <span className={`text-sm font-medium ${
                          transactionInsights.anomaliesDetected > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transactionInsights.anomaliesDetected}
                        </span>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm text-blue-800">
                            Real-time monitoring active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Data Mesh Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-gray-900 rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-white mb-3">
          🕸️ Data Mesh Architecture Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Domain Ownership</h4>
            <p className="text-xs text-gray-400 mt-1">Decentralized data ownership model</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Data Products</h4>
            <p className="text-xs text-gray-400 mt-1">Self-serve data infrastructure</p>
            <div className="flex items-center mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-white">Federated Governance</h4>
            <p className="text-xs text-gray-400 mt-1">Global governance with local autonomy</p>
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

export default DataInsightsDemo;