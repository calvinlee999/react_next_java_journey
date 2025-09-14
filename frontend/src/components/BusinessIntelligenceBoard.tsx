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
  PowerIcon
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="reports">Power BI Reports</TabsTrigger>
          <TabsTrigger value="schedules">Report Schedules</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceBoard;