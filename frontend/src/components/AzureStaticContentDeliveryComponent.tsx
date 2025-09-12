/**
 * Azure Static Content Delivery Management Component
 * Provides UI for managing Azure Blob Storage, CDN, and Front Door
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Types for our Azure static content delivery
interface StaticAsset {
  name: string;
  path: string;
  contentType: string;
  size: number;
  lastModified: Date;
  etag: string;
  cacheControl?: string;
  contentEncoding?: string;
}

interface DeploymentResult {
  success: boolean;
  deployedAssets: StaticAsset[];
  errors: string[];
  cdnPurged: boolean;
  frontDoorPurged: boolean;
  totalSize: number;
  deploymentTime: number;
}

interface ContentDeliveryMetrics {
  totalRequests: number;
  cacheHitRatio: number;
  averageLatency: number;
  bandwidthUsage: number;
  errorRate: number;
  topLocations: { location: string; requests: number }[];
  topAssets: { asset: string; requests: number }[];
}

interface AzureStaticContentConfig {
  subscriptionId: string;
  resourceGroupName: string;
  storageAccountName: string;
  cdnProfileName?: string;
  frontDoorProfileName?: string;
  frontDoorEndpointName?: string;
  environment: 'dev' | 'staging' | 'prod';
  enableCDN: boolean;
  enableFrontDoor: boolean;
  enableStaticWebsite: boolean;
}

// Mock service for demonstration (replace with actual Azure SDK integration)
class MockAzureStaticContentService {
  async deployFiles(files: File[], config: AzureStaticContentConfig): Promise<DeploymentResult> {
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deployedAssets: StaticAsset[] = files.map(file => ({
      name: file.name,
      path: `/${file.name}`,
      contentType: file.type,
      size: file.size,
      lastModified: new Date(),
      etag: `"${Math.random().toString(36).substr(2, 9)}"`,
      cacheControl: 'public, max-age=3600',
    }));

    return {
      success: true,
      deployedAssets,
      errors: [],
      cdnPurged: config.enableCDN,
      frontDoorPurged: config.enableFrontDoor,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      deploymentTime: 2000,
    };
  }

  async getMetrics(config: AzureStaticContentConfig): Promise<ContentDeliveryMetrics> {
    // Simulate metrics
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      totalRequests: Math.floor(Math.random() * 100000),
      cacheHitRatio: Math.random() * 100,
      averageLatency: Math.random() * 200,
      bandwidthUsage: Math.random() * 1000000,
      errorRate: Math.random() * 5,
      topLocations: [
        { location: 'US-East', requests: Math.floor(Math.random() * 50000) },
        { location: 'EU-West', requests: Math.floor(Math.random() * 30000) },
        { location: 'Asia-Pacific', requests: Math.floor(Math.random() * 20000) },
      ],
      topAssets: [
        { asset: '/main.js', requests: Math.floor(Math.random() * 10000) },
        { asset: '/styles.css', requests: Math.floor(Math.random() * 8000) },
        { asset: '/index.html', requests: Math.floor(Math.random() * 6000) },
      ],
    };
  }

  async purgeCache(config: AzureStaticContentConfig, paths: string[]): Promise<boolean> {
    // Simulate cache purge
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }
}

const mockService = new MockAzureStaticContentService();

export default function AzureStaticContentDeliveryComponent() {
  const [config, setConfig] = useState<AzureStaticContentConfig>({
    subscriptionId: '',
    resourceGroupName: 'react-java-journey-rg',
    storageAccountName: 'reactjavajourneydev',
    cdnProfileName: 'react-java-journey-cdn',
    frontDoorProfileName: 'react-java-journey-frontdoor',
    frontDoorEndpointName: 'main-endpoint',
    environment: 'dev',
    enableCDN: true,
    enableFrontDoor: true,
    enableStaticWebsite: true,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [metrics, setMetrics] = useState<ContentDeliveryMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'deploy' | 'metrics' | 'cache'>('deploy');
  const [purgeStatus, setPurgeStatus] = useState<string>('');

  // Load metrics on component mount
  useEffect(() => {
    loadMetrics();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  }, []);

  const handleDeploy = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsDeploying(true);
    try {
      const result = await mockService.deployFiles(selectedFiles, config);
      setDeploymentResult(result);
      
      // Refresh metrics after deployment
      setTimeout(() => {
        loadMetrics();
      }, 1000);
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  }, [selectedFiles, config]);

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const metricsData = await mockService.getMetrics(config);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [config]);

  const handlePurgeCache = useCallback(async () => {
    setPurgeStatus('Purging cache...');
    try {
      const paths = ['/*']; // Purge all
      await mockService.purgeCache(config, paths);
      setPurgeStatus('Cache purged successfully!');
      setTimeout(() => setPurgeStatus(''), 3000);
    } catch (error) {
      setPurgeStatus('Failed to purge cache');
      setTimeout(() => setPurgeStatus(''), 3000);
    }
  }, [config]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Azure Static Content Delivery Management
        </h1>
        
        {/* Configuration Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Account
              </label>
              <input
                type="text"
                value={config.storageAccountName}
                onChange={(e) => setConfig(prev => ({ ...prev, storageAccountName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Group
              </label>
              <input
                type="text"
                value={config.resourceGroupName}
                onChange={(e) => setConfig(prev => ({ ...prev, resourceGroupName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment
              </label>
              <select
                value={config.environment}
                onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as 'dev' | 'staging' | 'prod' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
            </div>
          </div>
          
          {/* Feature toggles */}
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableCDN}
                onChange={(e) => setConfig(prev => ({ ...prev, enableCDN: e.target.checked }))}
                className="mr-2"
              />
              Enable Azure CDN
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableFrontDoor}
                onChange={(e) => setConfig(prev => ({ ...prev, enableFrontDoor: e.target.checked }))}
                className="mr-2"
              />
              Enable Azure Front Door
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableStaticWebsite}
                onChange={(e) => setConfig(prev => ({ ...prev, enableStaticWebsite: e.target.checked }))}
                className="mr-2"
              />
              Enable Static Website
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['deploy', 'metrics', 'cache'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Deploy Static Files</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Select HTML, CSS, JS, and other static files to deploy
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{file.name}</span>
                      <span className="text-gray-500">{formatBytes(file.size)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy to Azure'}
                  </button>
                </div>
              </div>
            )}

            {deploymentResult && (
              <div className={`rounded-lg p-4 ${deploymentResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h4 className={`font-medium ${deploymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  Deployment {deploymentResult.success ? 'Successful' : 'Failed'}
                </h4>
                <div className="mt-2 text-sm space-y-1">
                  <p>Deployed {deploymentResult.deployedAssets.length} files</p>
                  <p>Total size: {formatBytes(deploymentResult.totalSize)}</p>
                  <p>Duration: {deploymentResult.deploymentTime}ms</p>
                  {config.enableCDN && <p>CDN cache: {deploymentResult.cdnPurged ? 'Purged' : 'Not purged'}</p>}
                  {config.enableFrontDoor && <p>Front Door cache: {deploymentResult.frontDoorPurged ? 'Purged' : 'Not purged'}</p>}
                </div>
                {deploymentResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-800">Errors:</p>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {deploymentResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Content Delivery Metrics</h3>
              <button
                onClick={loadMetrics}
                disabled={isLoadingMetrics}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoadingMetrics ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {isLoadingMetrics ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading metrics...</p>
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800">Total Requests</h4>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(metrics.totalRequests)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800">Cache Hit Ratio</h4>
                  <p className="text-2xl font-bold text-green-900">{metrics.cacheHitRatio.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800">Avg Latency</h4>
                  <p className="text-2xl font-bold text-orange-900">{metrics.averageLatency.toFixed(0)}ms</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800">Bandwidth</h4>
                  <p className="text-2xl font-bold text-purple-900">{formatBytes(metrics.bandwidthUsage)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800">Error Rate</h4>
                  <p className="text-2xl font-bold text-red-900">{metrics.errorRate.toFixed(2)}%</p>
                </div>
              </div>
            ) : null}

            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Top Locations</h4>
                  <div className="space-y-2">
                    {metrics.topLocations.map((location, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{location.location}</span>
                        <span className="font-medium">{formatNumber(location.requests)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Top Assets</h4>
                  <div className="space-y-2">
                    {metrics.topAssets.map((asset, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700 font-mono text-sm">{asset.asset}</span>
                        <span className="font-medium">{formatNumber(asset.requests)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cache Tab */}
        {activeTab === 'cache' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Cache Management</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Cache Purge</h4>
              <p className="text-sm text-yellow-700 mb-4">
                Purge cached content from CDN and Front Door to ensure users receive the latest version of your files.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePurgeCache}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                  >
                    Purge All Cache
                  </button>
                  {purgeStatus && (
                    <span className="text-sm font-medium text-yellow-800">{purgeStatus}</span>
                  )}
                </div>
                
                <div className="text-sm text-yellow-700">
                  <p>This will purge cache for:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {config.enableCDN && <li>Azure CDN endpoints</li>}
                    {config.enableFrontDoor && <li>Azure Front Door endpoints</li>}
                    <li>All static website content</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Cache Configuration</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Static Assets (CSS, JS, Images):</strong> 1 year cache</p>
                <p><strong>HTML Files:</strong> 1 hour cache</p>
                <p><strong>Other Files:</strong> 1 day cache</p>
                <p><strong>Compression:</strong> Enabled for text content</p>
                <p><strong>Query String Caching:</strong> Ignore query strings</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}