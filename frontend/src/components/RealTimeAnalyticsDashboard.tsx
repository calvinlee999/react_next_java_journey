'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Shield,
  Database,
  Zap,
  BarChart3,
  LineChart,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Globe,
  Server,
  Brain,
  Eye,
  TrendingDown,
  Info,
  Layers,
  Gauge
} from 'lucide-react';

// Types for real-time data
type HealthStatus = 'healthy' | 'warning' | 'error';
type ConnectivityStatus = 'connected' | 'disconnected' | 'degraded';
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
type AlertStatus = 'active' | 'investigating' | 'resolved';

interface TransactionMetrics {
  totalTransactions: number;
  transactionVolume: number;
  averageTransactionValue: number;
  transactionsPerSecond: number;
  successRate: number;
  fraudDetectionRate: number;
  timestamp: string;
}

interface FraudAlert {
  id: string;
  severity: AlertSeverity;
  type: string;
  description: string;
  timestamp: string;
  status: AlertStatus;
  riskScore: number;
  confidenceScore?: number;
  explanations?: ModelExplanation[];
}

// XAI (Explainable AI) Interfaces
interface ModelExplanation {
  feature: string;
  importance: number;
  value: string | number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  modelVersion: string;
  lastTrainingDate: string;
  driftScore: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: 'transaction' | 'user' | 'location' | 'temporal' | 'behavioral';
}

interface ModelPrediction {
  predictionId: string;
  prediction: 'fraud' | 'legitimate';
  confidenceScore: number;
  riskScore: number;
  explanations: ModelExplanation[];
  timestamp: string;
  modelVersion: string;
}

interface DataPipelineMetrics {
  bronzeIngestionRate: number;
  silverProcessingRate: number;
  goldAnalyticsRate: number;
  pipelineLatency: number;
  dataQualityScore: number;
  streamingJobsActive: number;
  batchJobsRunning: number;
}

interface SystemHealth {
  databricksClusterStatus: HealthStatus;
  kafkaTopicsHealth: HealthStatus;
  deltaLakeHealth: HealthStatus;
  powerBiConnectivity: ConnectivityStatus;
  overallHealth: number;
}

const RealTimeAnalyticsDashboard: React.FC = () => {
  // State management
  const [isStreaming, setIsStreaming] = useState(true);
  const [transactionMetrics, setTransactionMetrics] = useState<TransactionMetrics>({
    totalTransactions: 0,
    transactionVolume: 0,
    averageTransactionValue: 0,
    transactionsPerSecond: 0,
    successRate: 0,
    fraudDetectionRate: 0,
    timestamp: new Date().toISOString()
  });
  
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [pipelineMetrics, setPipelineMetrics] = useState<DataPipelineMetrics>({
    bronzeIngestionRate: 0,
    silverProcessingRate: 0,
    goldAnalyticsRate: 0,
    pipelineLatency: 0,
    dataQualityScore: 0,
    streamingJobsActive: 0,
    batchJobsRunning: 0
  });
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    databricksClusterStatus: 'healthy',
    kafkaTopicsHealth: 'healthy',
    deltaLakeHealth: 'healthy',
    powerBiConnectivity: 'connected',
    overallHealth: 100
  });

  // XAI (Explainable AI) State
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance>({
    accuracy: 94.2,
    precision: 92.8,
    recall: 95.1,
    f1Score: 93.9,
    modelVersion: 'v2.1.3',
    lastTrainingDate: '2024-01-15',
    driftScore: 0.12
  });

  const [featureImportances, setFeatureImportances] = useState<FeatureImportance[]>([
    { feature: 'transaction_amount', importance: 0.285, category: 'transaction' },
    { feature: 'user_activity_score', importance: 0.218, category: 'behavioral' },
    { feature: 'location_risk_score', importance: 0.156, category: 'location' },
    { feature: 'time_since_last_transaction', importance: 0.134, category: 'temporal' },
    { feature: 'merchant_category', importance: 0.097, category: 'transaction' },
    { feature: 'user_age_days', importance: 0.071, category: 'user' },
    { feature: 'velocity_1h', importance: 0.039, category: 'behavioral' }
  ]);

  const [recentPredictions, setRecentPredictions] = useState<ModelPrediction[]>([]);

  // Real-time data simulation
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = window.setInterval(() => {
        // Simulate real-time transaction metrics
        setTransactionMetrics(prev => ({
          totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 50) + 10,
          transactionVolume: prev.transactionVolume + (Math.random() * 100000) + 50000,
          averageTransactionValue: 150 + (Math.random() * 200),
          transactionsPerSecond: Math.floor(Math.random() * 100) + 50,
          successRate: 95 + (Math.random() * 4),
          fraudDetectionRate: Math.random() * 2,
          timestamp: new Date().toISOString()
        }));

        // Simulate fraud alerts with XAI data
        if (Math.random() < 0.1) { // 10% chance of new alert
          const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];
          const types = ['Unusual Transaction Pattern', 'Geographic Anomaly', 'Velocity Check', 'Risk Score Threshold'];
          const severity = severities[Math.floor(Math.random() * 4)];
          const confidenceScore = 0.75 + Math.random() * 0.25; // High confidence for alerts
          
          const explanations: ModelExplanation[] = [
            { feature: 'transaction_amount', importance: Math.random() * 0.4 + 0.3, value: Math.floor(Math.random() * 10000) + 1000, impact: 'positive' as const },
            { feature: 'location_risk_score', importance: Math.random() * 0.3 + 0.2, value: Math.random() * 10, impact: 'positive' as const },
            { feature: 'velocity_1h', importance: Math.random() * 0.2 + 0.1, value: Math.floor(Math.random() * 15) + 5, impact: 'positive' as const }
          ].sort((a, b) => b.importance - a.importance);

          const newAlert: FraudAlert = {
            id: `alert_${Date.now()}`,
            severity,
            type: types[Math.floor(Math.random() * 4)],
            description: 'Automated fraud detection triggered',
            timestamp: new Date().toISOString(),
            status: 'active',
            riskScore: Math.floor(Math.random() * 100),
            confidenceScore,
            explanations
          };
          setFraudAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
        }

        // Simulate pipeline metrics
        setPipelineMetrics({
          bronzeIngestionRate: Math.floor(Math.random() * 10000) + 5000,
          silverProcessingRate: Math.floor(Math.random() * 8000) + 4000,
          goldAnalyticsRate: Math.floor(Math.random() * 5000) + 2000,
          pipelineLatency: Math.floor(Math.random() * 500) + 100,
          dataQualityScore: 95 + (Math.random() * 4),
          streamingJobsActive: Math.floor(Math.random() * 5) + 8,
          batchJobsRunning: Math.floor(Math.random() * 3) + 2
        });

        // Simulate system health
        setSystemHealth({
          databricksClusterStatus: Math.random() > 0.9 ? 'warning' : 'healthy',
          kafkaTopicsHealth: Math.random() > 0.95 ? 'error' : 'healthy',
          deltaLakeHealth: 'healthy',
          powerBiConnectivity: Math.random() > 0.8 ? 'connected' : 'degraded',
          overallHealth: Math.floor(Math.random() * 10) + 90
        });

        // Simulate XAI model performance updates
        setModelPerformance(prev => ({
          ...prev,
          accuracy: Math.max(90, Math.min(98, prev.accuracy + (Math.random() - 0.5) * 0.5)),
          precision: Math.max(88, Math.min(96, prev.precision + (Math.random() - 0.5) * 0.8)),
          recall: Math.max(90, Math.min(98, prev.recall + (Math.random() - 0.5) * 0.6)),
          f1Score: Math.max(89, Math.min(97, prev.f1Score + (Math.random() - 0.5) * 0.4)),
          driftScore: Math.max(0.05, Math.min(0.3, prev.driftScore + (Math.random() - 0.5) * 0.02))
        }));

        // Simulate new model predictions with explanations
        if (Math.random() < 0.15) { // 15% chance of new prediction
          const isFraud = Math.random() < 0.12; // 12% fraud rate
          const confidenceScore = isFraud ? 0.7 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2;
          
          const explanations: ModelExplanation[] = [
            { feature: 'transaction_amount', importance: Math.random() * 0.3 + 0.2, value: Math.floor(Math.random() * 5000) + 100, impact: isFraud ? 'positive' as const : 'negative' as const },
            { feature: 'user_activity_score', importance: Math.random() * 0.25 + 0.15, value: Math.random() * 100, impact: isFraud ? 'negative' as const : 'positive' as const },
            { feature: 'location_risk_score', importance: Math.random() * 0.2 + 0.1, value: Math.random() * 10, impact: isFraud ? 'positive' as const : 'neutral' as const },
            { feature: 'velocity_1h', importance: Math.random() * 0.15 + 0.05, value: Math.floor(Math.random() * 20), impact: isFraud ? 'positive' as const : 'negative' as const }
          ].sort((a, b) => b.importance - a.importance);

          const newPrediction: ModelPrediction = {
            predictionId: `pred_${Date.now()}`,
            prediction: isFraud ? 'fraud' : 'legitimate',
            confidenceScore,
            riskScore: isFraud ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 10,
            explanations,
            timestamp: new Date().toISOString(),
            modelVersion: modelPerformance.modelVersion
          };

          setRecentPredictions(prev => [newPrediction, ...prev.slice(0, 19)]);
        }
      }, 2000); // Update every 2 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStreaming]);

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'error':
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Azure Databricks • Delta Live Tables • Power BI Integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isStreaming ? 'Pause Stream' : 'Start Stream'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">Databricks Cluster</span>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(systemHealth.databricksClusterStatus)}
                <span className={`text-sm capitalize ${getHealthColor(systemHealth.databricksClusterStatus)}`}>
                  {systemHealth.databricksClusterStatus}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Kafka Topics</span>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(systemHealth.kafkaTopicsHealth)}
                <span className={`text-sm capitalize ${getHealthColor(systemHealth.kafkaTopicsHealth)}`}>
                  {systemHealth.kafkaTopicsHealth}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Delta Lake</span>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(systemHealth.deltaLakeHealth)}
                <span className={`text-sm capitalize ${getHealthColor(systemHealth.deltaLakeHealth)}`}>
                  {systemHealth.deltaLakeHealth}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Power BI</span>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(systemHealth.powerBiConnectivity)}
                <span className={`text-sm capitalize ${getHealthColor(systemHealth.powerBiConnectivity)}`}>
                  {systemHealth.powerBiConnectivity}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall System Health</span>
              <span className="text-sm text-muted-foreground">{systemHealth.overallHealth}%</span>
            </div>
            <Progress value={systemHealth.overallHealth} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(transactionMetrics.totalTransactions)}</div>
            <p className="text-xs text-muted-foreground">
              {transactionMetrics.transactionsPerSecond}/sec current rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(transactionMetrics.transactionVolume)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(transactionMetrics.averageTransactionValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionMetrics.successRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Fraud Detection: {transactionMetrics.fraudDetectionRate.toFixed(3)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fraudAlerts.filter(a => a.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {fraudAlerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pipeline">Data Pipeline</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Real-Time Analytics</TabsTrigger>
          <TabsTrigger value="xai">Explainable AI</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Data Pipeline Tab */}
        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Delta Lake Pipeline Metrics
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Bronze → Silver → Gold data processing rates
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bronze Ingestion</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(pipelineMetrics.bronzeIngestionRate)} records/min
                    </span>
                  </div>
                  <Progress value={(pipelineMetrics.bronzeIngestionRate / 15000) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Silver Processing</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(pipelineMetrics.silverProcessingRate)} records/min
                    </span>
                  </div>
                  <Progress value={(pipelineMetrics.silverProcessingRate / 12000) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gold Analytics</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(pipelineMetrics.goldAnalyticsRate)} records/min
                    </span>
                  </div>
                  <Progress value={(pipelineMetrics.goldAnalyticsRate / 7000) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Pipeline Performance
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Latency and quality metrics
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {pipelineMetrics.pipelineLatency}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Pipeline Latency</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {pipelineMetrics.dataQualityScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Data Quality</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {pipelineMetrics.streamingJobsActive}
                    </div>
                    <div className="text-sm text-muted-foreground">Streaming Jobs</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {pipelineMetrics.batchJobsRunning}
                    </div>
                    <div className="text-sm text-muted-foreground">Batch Jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fraud Monitoring Tab */}
        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Fraud Alerts
              </CardTitle>
              <p className="text-sm text-gray-600">
                Real-time fraud detection powered by Databricks ML
              </p>
            </CardHeader>
            <CardContent>
              {fraudAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active fraud alerts
                </div>
              ) : (
                <div className="space-y-3">
                  {fraudAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <div className="font-medium">{alert.type}</div>
                          <div className="text-sm text-muted-foreground">
                            Risk Score: {alert.riskScore}/100 • {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{alert.status}</Badge>
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-Time Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Transaction Flow (Live)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time transaction processing visualization
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Live Transaction Chart</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connected to Databricks streaming job
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Transaction origins
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Transaction Map</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Global transaction flow
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Databricks cluster performance metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">42%</span>
                  </div>
                  <Progress value={42} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network I/O</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk I/O</span>
                    <span className="text-sm text-muted-foreground">34%</span>
                  </div>
                  <Progress value={34} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Query Performance
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Delta Lake query optimization
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-green-600">2.3s</div>
                      <div className="text-xs text-muted-foreground">Avg Query Time</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-blue-600">156</div>
                      <div className="text-xs text-muted-foreground">Queries/min</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-purple-600">99.2%</div>
                      <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-orange-600">4.2TB</div>
                      <div className="text-xs text-muted-foreground">Data Scanned</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Explainable AI Tab */}
        <TabsContent value="xai">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Performance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Model Performance
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time model accuracy and performance metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-green-600">{modelPerformance.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{modelPerformance.precision.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Precision</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{modelPerformance.recall.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Recall</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{modelPerformance.f1Score.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">F1-Score</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Model Drift Score</span>
                      <Gauge className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${modelPerformance.driftScore < 0.1 ? 'bg-green-500' : modelPerformance.driftScore < 0.2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${modelPerformance.driftScore * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{modelPerformance.driftScore.toFixed(3)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground">
                      Model Version: {modelPerformance.modelVersion} | Last Training: {modelPerformance.lastTrainingDate}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Importance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Feature Importance
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Most influential features in model predictions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureImportances.map((feature, index) => (
                    <div key={feature.feature} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{feature.feature.replace('_', ' ')}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            feature.category === 'transaction' ? 'bg-blue-100 text-blue-700' :
                            feature.category === 'behavioral' ? 'bg-green-100 text-green-700' :
                            feature.category === 'location' ? 'bg-purple-100 text-purple-700' :
                            feature.category === 'temporal' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {feature.category}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{(feature.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${feature.importance * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Model Confidence & Predictions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Recent Predictions with Explanations
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time model predictions with confidence scores and feature explanations
                </p>
              </CardHeader>
              <CardContent>
                {recentPredictions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent predictions available. Predictions will appear when the streaming is active.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPredictions.slice(0, 5).map((prediction) => (
                      <div key={prediction.predictionId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                prediction.prediction === 'fraud' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {prediction.prediction === 'fraud' ? 'Fraud Detected' : 'Legitimate'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(prediction.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Model: {prediction.modelVersion}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-bold">
                              {(prediction.confidenceScore * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Top Contributing Features:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {prediction.explanations.slice(0, 4).map((explanation, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{explanation.feature.replace('_', ' ')}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium">{(explanation.importance * 100).toFixed(1)}%</span>
                                  {explanation.impact === 'positive' ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                  ) : explanation.impact === 'negative' ? (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>{isStreaming ? 'Live Data Stream Active' : 'Data Stream Paused'}</span>
              </div>
              <span>Last Updated: {new Date(transactionMetrics.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Data Source: Azure Databricks Delta Live Tables</span>
              <span>Refresh Rate: 2s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalyticsDashboard;