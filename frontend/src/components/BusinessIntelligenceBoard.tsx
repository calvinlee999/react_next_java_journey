'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  PieChart,
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Share,
  Settings,
  Target,
  Award,
  Clock,
  FileText,
  Database,
  PowerIcon,
  Brain,
  Eye,
  Gauge,
  Info,
  Layers,
  AlertTriangle
} from 'lucide-react';

// TypeScript interfaces for business intelligence data
interface KPIMetric {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
}

interface BusinessMetrics {
  revenue: KPIMetric;
  transactions: KPIMetric;
  customers: KPIMetric;
  averageOrderValue: KPIMetric;
  conversionRate: KPIMetric;
  customerSatisfaction: KPIMetric;
}

interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  recipients: number;
}

interface PowerBIReport {
  id: string;
  name: string;
  workspace: string;
  lastRefresh: string;
  status: 'ready' | 'refreshing' | 'error';
  url: string;
}

// XAI (Explainable AI) Strategic Interfaces
interface ModelValidationMetric {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  businessImpact: number; // Revenue impact in $
  confidenceLevel: number;
  validationPeriod: string;
  trend: 'improving' | 'stable' | 'declining';
}

interface BusinessAIInsight {
  category: 'fraud_prevention' | 'customer_behavior' | 'revenue_optimization' | 'risk_assessment';
  insight: string;
  confidenceScore: number;
  potentialImpact: number; // In dollars
  recommendation: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  timeframe: string;
}

interface StrategicFeedback {
  feedbackId: string;
  businessObjective: string;
  modelPerformance: number;
  businessOutcome: number;
  gap: number;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
}

const BusinessIntelligenceBoard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    revenue: {
      name: 'Revenue',
      value: 2850000,
      previousValue: 2650000,
      unit: '$',
      change: 7.5,
      trend: 'up',
      target: 3000000
    },
    transactions: {
      name: 'Total Transactions',
      value: 45320,
      previousValue: 42100,
      unit: '',
      change: 7.6,
      trend: 'up',
      target: 50000
    },
    customers: {
      name: 'Active Customers',
      value: 12800,
      previousValue: 12200,
      unit: '',
      change: 4.9,
      trend: 'up',
      target: 15000
    },
    averageOrderValue: {
      name: 'Average Order Value',
      value: 62.89,
      previousValue: 62.95,
      unit: '$',
      change: -0.1,
      trend: 'down'
    },
    conversionRate: {
      name: 'Conversion Rate',
      value: 3.2,
      previousValue: 2.8,
      unit: '%',
      change: 14.3,
      trend: 'up',
      target: 4.0
    },
    customerSatisfaction: {
      name: 'Customer Satisfaction',
      value: 4.6,
      previousValue: 4.4,
      unit: '/5',
      change: 4.5,
      trend: 'up',
      target: 4.8
    }
  });

  const [reportSchedules] = useState<ReportSchedule[]>([
    {
      id: 'weekly-exec',
      name: 'Executive Weekly Summary',
      frequency: 'weekly',
      nextRun: '2024-01-15T09:00:00Z',
      status: 'active',
      recipients: 8
    },
    {
      id: 'monthly-board',
      name: 'Board Monthly Report',
      frequency: 'monthly',
      nextRun: '2024-02-01T08:00:00Z',
      status: 'active',
      recipients: 12
    },
    {
      id: 'daily-ops',
      name: 'Operations Daily Digest',
      frequency: 'daily',
      nextRun: '2024-01-13T07:00:00Z',
      status: 'active',
      recipients: 25
    }
  ]);

  const [powerBIReports] = useState<PowerBIReport[]>([
    {
      id: 'financial-dashboard',
      name: 'Financial Performance Dashboard',
      workspace: 'Finance Analytics',
      lastRefresh: '2024-01-12T06:30:00Z',
      status: 'ready',
      url: '#'
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics Report',
      workspace: 'Marketing Intelligence',
      lastRefresh: '2024-01-12T06:00:00Z',
      status: 'ready',
      url: '#'
    },
    {
      id: 'operational-metrics',
      name: 'Operational Metrics',
      workspace: 'Operations',
      lastRefresh: '2024-01-12T05:45:00Z',
      status: 'refreshing',
      url: '#'
    }
  ]);

  // XAI Strategic Validation State
  const [modelValidations] = useState<ModelValidationMetric[]>([
    {
      modelName: 'Fraud Detection Model',
      accuracy: 94.2,
      precision: 92.8,
      recall: 95.1,
      f1Score: 93.9,
      businessImpact: 2850000, // Revenue protected
      confidenceLevel: 96.5,
      validationPeriod: 'Last 30 Days',
      trend: 'improving'
    },
    {
      modelName: 'Customer Behavior Prediction',
      accuracy: 88.7,
      precision: 87.2,
      recall: 90.3,
      f1Score: 88.7,
      businessImpact: 1420000, // Revenue generated
      confidenceLevel: 91.2,
      validationPeriod: 'Last 30 Days',
      trend: 'stable'
    },
    {
      modelName: 'Risk Assessment Engine',
      accuracy: 91.4,
      precision: 89.6,
      recall: 93.2,
      f1Score: 91.4,
      businessImpact: 980000, // Risk mitigated
      confidenceLevel: 94.8,
      validationPeriod: 'Last 30 Days',
      trend: 'improving'
    }
  ]);

  const [businessAIInsights] = useState<BusinessAIInsight[]>([
    {
      category: 'fraud_prevention',
      insight: 'Geographic transaction patterns show 23% reduction in false positives with new location-based features',
      confidenceScore: 94.2,
      potentialImpact: 450000,
      recommendation: 'Expand geographic risk scoring to include velocity patterns',
      implementationComplexity: 'medium',
      timeframe: '6-8 weeks'
    },
    {
      category: 'customer_behavior',
      insight: 'Time-based transaction features improve customer segmentation accuracy by 18%',
      confidenceScore: 87.6,
      potentialImpact: 320000,
      recommendation: 'Implement temporal behavior models for personalized offers',
      implementationComplexity: 'high',
      timeframe: '10-12 weeks'
    },
    {
      category: 'revenue_optimization',
      insight: 'Model confidence correlates with 89% success rate in high-value transaction processing',
      confidenceScore: 91.8,
      potentialImpact: 1200000,
      recommendation: 'Create confidence-based transaction routing system',
      implementationComplexity: 'low',
      timeframe: '3-4 weeks'
    }
  ]);

  const [strategicFeedback] = useState<StrategicFeedback[]>([
    {
      feedbackId: 'SF-001',
      businessObjective: 'Reduce fraud losses by 25%',
      modelPerformance: 94.2,
      businessOutcome: 89.7,
      gap: -4.5,
      actionItems: [
        'Enhance geographic risk scoring',
        'Implement real-time feedback loops',
        'Increase training data diversity'
      ],
      priority: 'high',
      owner: 'Risk Management Team'
    },
    {
      feedbackId: 'SF-002',
      businessObjective: 'Improve customer experience score to 4.8/5',
      modelPerformance: 88.7,
      businessOutcome: 92.0,
      gap: 3.3,
      actionItems: [
        'Reduce false positive alerts',
        'Optimize transaction approval speed',
        'Enhance customer communication'
      ],
      priority: 'medium',
      owner: 'Customer Experience Team'
    }
  ]);

  // Simulate data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call to Azure Databricks batch processing
    setTimeout(() => {
      // Update metrics with new simulated data
      setBusinessMetrics(prev => ({
        revenue: {
          ...prev.revenue,
          value: prev.revenue.value + (Math.random() * 100000 - 50000),
          change: (Math.random() * 20) - 10
        },
        transactions: {
          ...prev.transactions,
          value: prev.transactions.value + Math.floor(Math.random() * 1000 - 500),
          change: (Math.random() * 15) - 5
        },
        customers: {
          ...prev.customers,
          value: prev.customers.value + Math.floor(Math.random() * 200 - 100),
          change: (Math.random() * 10) - 2
        },
        averageOrderValue: {
          ...prev.averageOrderValue,
          value: prev.averageOrderValue.value + (Math.random() * 10 - 5),
          change: (Math.random() * 6) - 3
        },
        conversionRate: {
          ...prev.conversionRate,
          value: prev.conversionRate.value + (Math.random() * 0.5 - 0.25),
          change: (Math.random() * 20) - 10
        },
        customerSatisfaction: {
          ...prev.customerSatisfaction,
          value: Math.min(5, Math.max(1, prev.customerSatisfaction.value + (Math.random() * 0.2 - 0.1))),
          change: (Math.random() * 8) - 4
        }
      }));
      setIsRefreshing(false);
    }, 2000);
  };

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'refreshing':
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Powered by Azure Databricks Data Mesh • Weekly & Monthly Analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="flex gap-2">
        {(['weekly', 'monthly', 'quarterly'] as const).map((timeframe) => (
          <Button
            key={timeframe}
            variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe(timeframe)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="reports">Power BI Reports</TabsTrigger>
          <TabsTrigger value="schedules">Report Schedules</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
          <TabsTrigger value="xai">AI Validation</TabsTrigger>
        </TabsList>

        {/* Executive Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(businessMetrics).map(([key, metric]) => (
              <Card key={key} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  {getTrendIcon(metric.trend)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      if (metric.unit === '$') return formatCurrency(metric.value);
                      if (metric.unit === '%') return `${metric.value.toFixed(1)}%`;
                      if (metric.unit === '/5') return `${metric.value.toFixed(1)}/5`;
                      return formatNumber(metric.value);
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(metric.change)}
                    </span>
                    <span>vs previous {selectedTimeframe.slice(0, -2)}</span>
                  </div>
                  {metric.target && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress to Target</span>
                        <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend ({selectedTimeframe})
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Monthly revenue progression with forecasting
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Revenue Trend Chart</p>
                    <p className="text-xs text-muted-foreground mt-1">Powered by Azure Databricks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Customer Segments
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Customer distribution by value segments
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Customer Segmentation</p>
                    <p className="text-xs text-muted-foreground mt-1">ML-powered analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Power BI Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {powerBIReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PowerIcon className="h-5 w-5 text-yellow-600" />
                    {report.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Workspace: {report.workspace}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusBadgeColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Refresh:</span>
                      <span className="text-sm">
                        {new Date(report.lastRefresh).toLocaleString()}
                      </span>
                    </div>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Open Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Report Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <div className="space-y-4">
            {reportSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <h3 className="font-semibold">{schedule.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Frequency: {schedule.frequency}</span>
                        <span>Recipients: {schedule.recipients}</span>
                        <span>Next Run: {new Date(schedule.nextRun).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusBadgeColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Business Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Performance Insights
                </CardTitle>
                <p className="text-sm text-gray-600">
                  AI-powered business intelligence recommendations
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Performance Achievement</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Conversion rate improved by 14.3% this month, exceeding industry benchmarks.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Growth Opportunity</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Customer acquisition is trending upward. Consider increasing marketing spend.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Action Required</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Average order value declined slightly. Review pricing strategy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Pipeline Health
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Azure Databricks batch processing status
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Bronze Layer Ingestion</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Silver Layer Processing</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gold Layer Analytics</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Power BI Sync</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Refreshing</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Last batch processing: {new Date().toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Next scheduled run: {new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Validation Tab */}
        <TabsContent value="xai" className="space-y-6">
          {/* Model Validation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelValidations.map((model) => (
              <Card key={model.modelName} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {model.modelName}
                    </CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      model.trend === 'improving' ? 'bg-green-100 text-green-700' :
                      model.trend === 'stable' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {model.trend}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 border rounded">
                      <div className="text-lg font-bold text-green-600">{model.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-2 border rounded">
                      <div className="text-lg font-bold text-blue-600">{model.f1Score.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">F1-Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Business Impact</span>
                      <span className="text-sm font-bold text-green-600">
                        ${(model.businessImpact / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        <span className="text-sm font-bold">{model.confidenceLevel.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Validation Period: {model.validationPeriod}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Business AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Strategic AI Insights
              </CardTitle>
              <p className="text-sm text-gray-600">
                AI-driven business recommendations with confidence scores and impact analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessAIInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            insight.category === 'fraud_prevention' ? 'bg-red-100 text-red-800' :
                            insight.category === 'customer_behavior' ? 'bg-blue-100 text-blue-800' :
                            insight.category === 'revenue_optimization' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {insight.category.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {insight.confidenceScore.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm font-medium">{insight.insight}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                      <div className="text-right space-y-1 ml-4">
                        <div className="text-lg font-bold text-green-600">
                          ${(insight.potentialImpact / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.implementationComplexity === 'low' ? 'bg-green-100 text-green-700' :
                          insight.implementationComplexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {insight.implementationComplexity} complexity
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Timeframe: {insight.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategic Feedback Loop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Strategic Feedback & Alignment
              </CardTitle>
              <p className="text-sm text-gray-600">
                Business objective alignment with AI model performance and gap analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategicFeedback.map((feedback) => (
                  <div key={feedback.feedbackId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{feedback.businessObjective}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feedback.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            feedback.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {feedback.priority} priority
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Owner: {feedback.owner} | ID: {feedback.feedbackId}
                        </div>
                      </div>
                      <div className="text-right space-y-1 ml-4">
                        <div className={`text-lg font-bold ${feedback.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {feedback.gap >= 0 ? '+' : ''}{feedback.gap.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Gap</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Model Performance</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${feedback.modelPerformance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{feedback.modelPerformance.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Business Outcome</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${feedback.businessOutcome}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{feedback.businessOutcome.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Action Items:</div>
                      <ul className="space-y-1">
                        {feedback.actionItems.map((item, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Performance Alert */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                AI Performance Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-orange-700">
                  <strong>Model Drift Detected:</strong> Customer Behavior Prediction model showing 2.3% accuracy decline over the past week.
                </p>
                <div className="flex items-center gap-4 text-xs text-orange-600">
                  <span>Recommended Action: Retrain with recent data</span>
                  <span>•</span>
                  <span>Est. Impact: -$45K/month if unaddressed</span>
                  <span>•</span>
                  <span>Priority: High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceBoard;