/**
 * Big Data Platform Dashboard Component
 * 
 * This component demonstrates the comprehensive big data platform with
 * unified event-driven architecture, AI governance, data quality controls,
 * and Azure Databricks integration.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Zap,
  BarChart3,
  GitBranch,
  Play,
  Pause,
  RefreshCw
} from '@/components/ui/icons';

// Type definitions for the big data platform
interface KafkaMetrics {
  topics: number;
  partitions: number;
  throughputMbps: number;
  latencyMs: number;
  messagesPerSecond: number;
  consumerLag: number;
}

interface GovernanceMetrics {
  classificationAccuracy: number;
  piiDetectionRate: number;
  complianceScore: number;
  anomaliesDetected: number;
  policiesEnforced: number;
  dataClassified: number;
}

interface QualityMetrics {
  overallScore: number;
  completeness: number;
  validity: number;
  consistency: number;
  uniqueness: number;
  rulesExecuted: number;
  qualityGatesPassed: number;
}

interface LineageMetrics {
  datasetsTracked: number;
  transformationsLogged: number;
  lineageCompleteness: number;
  integrityChecksPassed: number;
  auditTrailEntries: number;
  checksumVerifications: number;
}

interface DatabricksMetrics {
  clustersActive: number;
  jobsRunning: number;
  realTimeLatency: number;
  batchThroughput: number;
  mlModelsDeployed: number;
  deltaLakeSize: string;
}

interface PlatformStatus {
  kafka: KafkaMetrics;
  governance: GovernanceMetrics;
  quality: QualityMetrics;
  lineage: LineageMetrics;
  databricks: DatabricksMetrics;
  lastUpdated: string;
  isStreaming: boolean;
}

export default function BigDataPlatformDashboard() {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Mock data for demonstration
  const mockPlatformData = useCallback((): PlatformStatus => ({
    kafka: {
      topics: 24,
      partitions: 96,
      throughputMbps: 45.7,
      latencyMs: 2.3,
      messagesPerSecond: 125000,
      consumerLag: 150
    },
    governance: {
      classificationAccuracy: 94.8,
      piiDetectionRate: 99.2,
      complianceScore: 96.5,
      anomaliesDetected: 3,
      policiesEnforced: 47,
      dataClassified: 1240000
    },
    quality: {
      overallScore: 92.3,
      completeness: 95.7,
      validity: 91.2,
      consistency: 89.8,
      uniqueness: 92.1,
      rulesExecuted: 156,
      qualityGatesPassed: 142
    },
    lineage: {
      datasetsTracked: 847,
      transformationsLogged: 2340,
      lineageCompleteness: 97.8,
      integrityChecksPassed: 99.1,
      auditTrailEntries: 45670,
      checksumVerifications: 2340
    },
    databricks: {
      clustersActive: 8,
      jobsRunning: 23,
      realTimeLatency: 1.2,
      batchThroughput: 2.4,
      mlModelsDeployed: 12,
      deltaLakeSize: '47.3 TB'
    },
    lastUpdated: new Date().toISOString(),
    isStreaming: true
  }), []);

  // Simulate real-time updates
  useEffect(() => {
    const fetchPlatformData = () => {
      try {
        setLoading(true);
        // Simulate API call with slight variations
        const baseData = mockPlatformData();
        const variation = 0.1; // 10% variation
        
        setPlatformStatus({
          ...baseData,
          kafka: {
            ...baseData.kafka,
            throughputMbps: baseData.kafka.throughputMbps * (1 + (Math.random() - 0.5) * variation),
            latencyMs: baseData.kafka.latencyMs * (1 + (Math.random() - 0.5) * variation),
            messagesPerSecond: Math.floor(baseData.kafka.messagesPerSecond * (1 + (Math.random() - 0.5) * variation)),
            consumerLag: Math.floor(baseData.kafka.consumerLag * (1 + (Math.random() - 0.5) * variation))
          },
          governance: {
            ...baseData.governance,
            anomaliesDetected: Math.floor(Math.random() * 10),
            dataClassified: baseData.governance.dataClassified + Math.floor(Math.random() * 1000)
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch platform data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformData();
    
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(fetchPlatformData, 3000); // Update every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, mockPlatformData]);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const getStatusColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 85) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  if (loading && !platformStatus) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading Big Data Platform...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading platform data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!platformStatus) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Big Data Platform Dashboard</h1>
          <p className="text-gray-600">Unified Event-Driven Architecture with AI Governance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleStreaming}
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
          >
            {isStreaming ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isStreaming ? 'Stop' : 'Start'} Live Updates
          </Button>
          <Badge variant="outline">
            Last Updated: {new Date(platformStatus.lastUpdated).toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kafka Throughput</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStatus.kafka.throughputMbps.toFixed(1)} MB/s</div>
            <p className="text-xs text-muted-foreground">
              {platformStatus.kafka.messagesPerSecond.toLocaleString()} msg/sec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Governance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(platformStatus.governance.complianceScore)}`}>
              {platformStatus.governance.complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {platformStatus.governance.anomaliesDetected} anomalies detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(platformStatus.quality.overallScore)}`}>
              {platformStatus.quality.overallScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {platformStatus.quality.qualityGatesPassed}/{platformStatus.quality.rulesExecuted} gates passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lineage Completeness</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(platformStatus.lineage.lineageCompleteness)}`}>
              {platformStatus.lineage.lineageCompleteness}%
            </div>
            <p className="text-xs text-muted-foreground">
              {platformStatus.lineage.datasetsTracked} datasets tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="databricks">Databricks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Apache Kafka Event Backbone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Topics:</span>
                  <Badge>{platformStatus.kafka.topics}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Partitions:</span>
                  <Badge>{platformStatus.kafka.partitions}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <Badge className={platformStatus.kafka.latencyMs < 5 ? "bg-green-100" : "bg-yellow-100"}>
                    {platformStatus.kafka.latencyMs.toFixed(1)}ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Consumer Lag:</span>
                  <Badge className={platformStatus.kafka.consumerLag < 1000 ? "bg-green-100" : "bg-red-100"}>
                    {platformStatus.kafka.consumerLag}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Azure Databricks Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Clusters:</span>
                  <Badge>{platformStatus.databricks.clustersActive}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Running Jobs:</span>
                  <Badge>{platformStatus.databricks.jobsRunning}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Real-time Latency:</span>
                  <Badge className="bg-green-100">{platformStatus.databricks.realTimeLatency}ms</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Delta Lake Size:</span>
                  <Badge>{platformStatus.databricks.deltaLakeSize}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                AI-Powered Data Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Classification Accuracy</span>
                  <span className="font-semibold">{platformStatus.governance.classificationAccuracy}%</span>
                </div>
                <Progress value={platformStatus.governance.classificationAccuracy} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>PII Detection Rate</span>
                  <span className="font-semibold">{platformStatus.governance.piiDetectionRate}%</span>
                </div>
                <Progress value={platformStatus.governance.piiDetectionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{platformStatus.governance.policiesEnforced}</div>
                  <div className="text-sm text-blue-600">Policies Enforced</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{platformStatus.governance.dataClassified.toLocaleString()}</div>
                  <div className="text-sm text-green-600">Records Classified</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Data Quality Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(platformStatus.quality.completeness)}`}>
                    {platformStatus.quality.completeness}%
                  </div>
                  <div className="text-sm text-gray-600">Completeness</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(platformStatus.quality.validity)}`}>
                    {platformStatus.quality.validity}%
                  </div>
                  <div className="text-sm text-gray-600">Validity</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(platformStatus.quality.consistency)}`}>
                    {platformStatus.quality.consistency}%
                  </div>
                  <div className="text-sm text-gray-600">Consistency</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(platformStatus.quality.uniqueness)}`}>
                    {platformStatus.quality.uniqueness}%
                  </div>
                  <div className="text-sm text-gray-600">Uniqueness</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span>Overall Quality Score</span>
                  {getStatusBadge(platformStatus.quality.overallScore)}
                </div>
                <Progress value={platformStatus.quality.overallScore} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Data Lineage & Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{platformStatus.lineage.datasetsTracked}</div>
                  <div className="text-sm text-purple-600">Datasets Tracked</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{platformStatus.lineage.transformationsLogged}</div>
                  <div className="text-sm text-indigo-600">Transformations</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{platformStatus.lineage.auditTrailEntries.toLocaleString()}</div>
                  <div className="text-sm text-teal-600">Audit Entries</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Lineage Completeness</span>
                  <span className="font-semibold">{platformStatus.lineage.lineageCompleteness}%</span>
                </div>
                <Progress value={platformStatus.lineage.lineageCompleteness} className="h-2" />
                
                <div className="flex justify-between">
                  <span>Integrity Checks Passed</span>
                  <span className="font-semibold">{platformStatus.lineage.integrityChecksPassed}%</span>
                </div>
                <Progress value={platformStatus.lineage.integrityChecksPassed} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="databricks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Azure Databricks Unified Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Processing Modes</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Real-time Latency:</span>
                      <Badge className="bg-green-100">{platformStatus.databricks.realTimeLatency}ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Batch Throughput:</span>
                      <Badge className="bg-blue-100">{platformStatus.databricks.batchThroughput} TB/hr</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">ML Operations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Models Deployed:</span>
                      <Badge>{platformStatus.databricks.mlModelsDeployed}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Delta Lake Storage:</span>
                      <Badge className="bg-orange-100">{platformStatus.databricks.deltaLakeSize}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Processing Pipeline Status</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">Real-time</div>
                    <div>Streaming Active</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">Near-time</div>
                    <div>Micro-batching</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">Batch</div>
                    <div>Scheduled Jobs</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}