// Health Check API for Next.js SSR deployment
// Provides comprehensive health status for containerized deployments

import { NextResponse } from 'next/server';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  cloudProvider: string;
  deploymentType: string;
  version: string;
  memory: {
    used: number;
    total: number;
    rss: number;
  };
  responseTime: number;
  aws?: {
    region?: string;
    availabilityZone?: string;
    instanceId?: string;
  };
  azure?: {
    region?: string;
    resourceGroup?: string;
    subscriptionId?: string;
  };
  kubernetes?: {
    namespace: string;
    podName?: string;
    serviceName?: string;
  };
  container?: {
    name?: string;
    image?: string;
    tag: string;
  };
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const healthData: HealthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      cloudProvider: process.env.CLOUD_PROVIDER || 'local',
      deploymentType: process.env.DEPLOYMENT_TARGET || 'standalone',
      version: '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      responseTime: Date.now() - startTime,
    };

    // Add cloud-specific health information
    if (process.env.CLOUD_PROVIDER === 'aws') {
      healthData.aws = {
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
        availabilityZone: process.env.AWS_AVAILABILITY_ZONE,
        instanceId: process.env.AWS_INSTANCE_ID,
      };
    }

    if (process.env.CLOUD_PROVIDER === 'azure') {
      healthData.azure = {
        region: process.env.AZURE_REGION,
        resourceGroup: process.env.AZURE_RESOURCE_GROUP,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
      };
    }

    // Kubernetes information (if running in K8s)
    if (process.env.KUBERNETES_SERVICE_HOST) {
      healthData.kubernetes = {
        namespace: process.env.KUBERNETES_NAMESPACE || 'default',
        podName: process.env.HOSTNAME,
        serviceName: process.env.KUBERNETES_SERVICE_NAME,
      };
    }

    // Container information
    if (process.env.CONTAINER_NAME || process.env.HOSTNAME) {
      healthData.container = {
        name: process.env.CONTAINER_NAME || process.env.HOSTNAME,
        image: process.env.CONTAINER_IMAGE,
        tag: process.env.CONTAINER_TAG || 'latest',
      };
    }

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}

// Support for HEAD requests (common for load balancer health checks)
export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Health check HEAD error:', error);
    return new NextResponse(null, { status: 503 });
  }
}
