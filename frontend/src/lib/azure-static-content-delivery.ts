/**
 * Azure Static Content Delivery SDK
 * Provides comprehensive integration with Azure Blob Storage, CDN, and Front Door
 * for optimized static content delivery and global performance
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Configuration interfaces
export interface AzureStaticContentConfig {
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

export interface BlobStorageConfig {
  accountName: string;
  accountKey?: string;
  sasToken?: string;
  containerName: string;
  endpoint?: string;
}

export interface CDNConfig {
  profileName: string;
  endpointName: string;
  resourceGroupName: string;
  subscriptionId: string;
}

export interface FrontDoorConfig {
  profileName: string;
  endpointName: string;
  resourceGroupName: string;
  subscriptionId: string;
}

// Content delivery interfaces
export interface StaticAsset {
  name: string;
  path: string;
  contentType: string;
  size: number;
  lastModified: Date;
  etag: string;
  cacheControl?: string;
  contentEncoding?: string;
}

export interface DeploymentResult {
  success: boolean;
  deployedAssets: StaticAsset[];
  errors: string[];
  cdnPurged: boolean;
  frontDoorPurged: boolean;
  totalSize: number;
  deploymentTime: number;
}

export interface ContentDeliveryMetrics {
  totalRequests: number;
  cacheHitRatio: number;
  averageLatency: number;
  bandwidthUsage: number;
  errorRate: number;
  topLocations: { location: string; requests: number }[];
  topAssets: { asset: string; requests: number }[];
}

// Azure Blob Storage Client
export class AzureBlobStorageClient {
  private config: BlobStorageConfig;
  private httpClient: AxiosInstance;

  constructor(config: BlobStorageConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.endpoint || `https://${config.accountName}.blob.core.windows.net`,
      timeout: 30000,
    });
  }

  /**
   * Upload a file to Azure Blob Storage
   */
  async uploadFile(
    fileName: string,
    content: Buffer | string,
    options: {
      contentType?: string;
      cacheControl?: string;
      contentEncoding?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<StaticAsset> {
    try {
      const url = `/${this.config.containerName}/${fileName}`;
      const headers: Record<string, string> = {
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-version': '2021-12-02',
        'Content-Length': Buffer.isBuffer(content) ? content.length.toString() : Buffer.byteLength(content, 'utf8').toString(),
      };

      if (this.config.sasToken) {
        // Use SAS token authentication
        const sasUrl = `${url}?${this.config.sasToken}`;
        if (options.contentType) headers['Content-Type'] = options.contentType;
        if (options.cacheControl) headers['Cache-Control'] = options.cacheControl;
        if (options.contentEncoding) headers['Content-Encoding'] = options.contentEncoding;

        const response = await this.httpClient.put(sasUrl, content, { headers });

        return {
          name: fileName,
          path: url,
          contentType: options.contentType || 'application/octet-stream',
          size: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8'),
          lastModified: new Date(),
          etag: response.headers.etag || '',
          cacheControl: options.cacheControl,
          contentEncoding: options.contentEncoding,
        };
      } else {
        throw new Error('Authentication method not supported. Please provide SAS token.');
      }
    } catch (error) {
      console.error('Error uploading file to blob storage:', error);
      throw new Error(`Failed to upload ${fileName}: ${error}`);
    }
  }

  /**
   * Upload multiple files to Azure Blob Storage
   */
  async uploadFiles(
    files: { name: string; content: Buffer | string; options?: any }[]
  ): Promise<StaticAsset[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(file.name, file.content, file.options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * List files in the blob storage container
   */
  async listFiles(prefix?: string): Promise<StaticAsset[]> {
    try {
      const url = `/${this.config.containerName}`;
      const params: Record<string, string> = {
        'restype': 'container',
        'comp': 'list',
      };

      if (prefix) params['prefix'] = prefix;
      if (this.config.sasToken) params['sas'] = this.config.sasToken;

      const response = await this.httpClient.get(url, { params });
      
      // Parse XML response (simplified)
      // In a real implementation, you'd use an XML parser
      const assets: StaticAsset[] = [];
      
      return assets;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from blob storage
   */
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const url = `/${this.config.containerName}/${fileName}`;
      const params: Record<string, string> = {};
      
      if (this.config.sasToken) params['sas'] = this.config.sasToken;

      await this.httpClient.delete(url, { params });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName: string): Promise<StaticAsset | null> {
    try {
      const url = `/${this.config.containerName}/${fileName}`;
      const params: Record<string, string> = {};
      
      if (this.config.sasToken) params['sas'] = this.config.sasToken;

      const response = await this.httpClient.head(url, { params });

      return {
        name: fileName,
        path: url,
        contentType: response.headers['content-type'] || 'application/octet-stream',
        size: parseInt(response.headers['content-length'] || '0'),
        lastModified: new Date(response.headers['last-modified']),
        etag: response.headers['etag'] || '',
        cacheControl: response.headers['cache-control'],
        contentEncoding: response.headers['content-encoding'],
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}

// Azure CDN Client
export class AzureCDNClient {
  private config: CDNConfig;
  private httpClient: AxiosInstance;

  constructor(config: CDNConfig, accessToken: string) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: 'https://management.azure.com',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Purge CDN cache for specific paths
   */
  async purgeCache(contentPaths: string[]): Promise<boolean> {
    try {
      const url = `/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroupName}/providers/Microsoft.Cdn/profiles/${this.config.profileName}/endpoints/${this.config.endpointName}/purge`;
      
      const purgeRequest = {
        contentPaths: contentPaths.map(path => path.startsWith('/') ? path : `/${path}`)
      };

      await this.httpClient.post(url, purgeRequest, {
        params: { 'api-version': '2023-05-01' }
      });

      return true;
    } catch (error) {
      console.error('Error purging CDN cache:', error);
      return false;
    }
  }

  /**
   * Get CDN endpoint metrics
   */
  async getMetrics(
    startTime: Date,
    endTime: Date,
    metrics: string[] = ['RequestCount', 'BytesTransferred', 'CacheHitRatio']
  ): Promise<ContentDeliveryMetrics | null> {
    try {
      const url = `/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroupName}/providers/Microsoft.Cdn/profiles/${this.config.profileName}/endpoints/${this.config.endpointName}/providers/Microsoft.Insights/metrics`;
      
      const params = {
        'api-version': '2021-05-01',
        'timespan': `${startTime.toISOString()}/${endTime.toISOString()}`,
        'metricnames': metrics.join(','),
        'aggregation': 'Average,Total'
      };

      const response = await this.httpClient.get(url, { params });
      
      // Process metrics data
      const metricsData = response.data.value;
      
      return {
        totalRequests: this.extractMetricValue(metricsData, 'RequestCount'),
        cacheHitRatio: this.extractMetricValue(metricsData, 'CacheHitRatio'),
        averageLatency: this.extractMetricValue(metricsData, 'OriginLatency'),
        bandwidthUsage: this.extractMetricValue(metricsData, 'BytesTransferred'),
        errorRate: this.extractMetricValue(metricsData, 'ErrorRate'),
        topLocations: [],
        topAssets: [],
      };
    } catch (error) {
      console.error('Error getting CDN metrics:', error);
      return null;
    }
  }

  private extractMetricValue(metricsData: any[], metricName: string): number {
    const metric = metricsData.find(m => m.name.value === metricName);
    if (metric && metric.timeseries && metric.timeseries[0] && metric.timeseries[0].data) {
      const latestData = metric.timeseries[0].data[metric.timeseries[0].data.length - 1];
      return latestData.total || latestData.average || 0;
    }
    return 0;
  }
}

// Azure Front Door Client
export class AzureFrontDoorClient {
  private config: FrontDoorConfig;
  private httpClient: AxiosInstance;

  constructor(config: FrontDoorConfig, accessToken: string) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: 'https://management.azure.com',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Purge Front Door cache
   */
  async purgeCache(domains: string[], contentPaths: string[]): Promise<boolean> {
    try {
      const url = `/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroupName}/providers/Microsoft.Cdn/profiles/${this.config.profileName}/purge`;
      
      const purgeRequest = {
        domains,
        contentPaths: contentPaths.map(path => path.startsWith('/') ? path : `/${path}`)
      };

      await this.httpClient.post(url, purgeRequest, {
        params: { 'api-version': '2023-05-01' }
      });

      return true;
    } catch (error) {
      console.error('Error purging Front Door cache:', error);
      return false;
    }
  }

  /**
   * Get Front Door metrics
   */
  async getMetrics(
    startTime: Date,
    endTime: Date
  ): Promise<ContentDeliveryMetrics | null> {
    try {
      const url = `/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroupName}/providers/Microsoft.Cdn/profiles/${this.config.profileName}/providers/Microsoft.Insights/metrics`;
      
      const params = {
        'api-version': '2021-05-01',
        'timespan': `${startTime.toISOString()}/${endTime.toISOString()}`,
        'metricnames': 'RequestCount,BytesTransferred,ResponseLatency',
        'aggregation': 'Average,Total'
      };

      const response = await this.httpClient.get(url, { params });
      
      const metricsData = response.data.value;
      
      return {
        totalRequests: this.extractMetricValue(metricsData, 'RequestCount'),
        cacheHitRatio: this.extractMetricValue(metricsData, 'CacheHitRatio'),
        averageLatency: this.extractMetricValue(metricsData, 'ResponseLatency'),
        bandwidthUsage: this.extractMetricValue(metricsData, 'BytesTransferred'),
        errorRate: this.extractMetricValue(metricsData, 'ErrorRate'),
        topLocations: [],
        topAssets: [],
      };
    } catch (error) {
      console.error('Error getting Front Door metrics:', error);
      return null;
    }
  }

  private extractMetricValue(metricsData: any[], metricName: string): number {
    const metric = metricsData.find(m => m.name.value === metricName);
    if (metric && metric.timeseries && metric.timeseries[0] && metric.timeseries[0].data) {
      const latestData = metric.timeseries[0].data[metric.timeseries[0].data.length - 1];
      return latestData.total || latestData.average || 0;
    }
    return 0;
  }
}

// Main Static Content Delivery Manager
export class AzureStaticContentDeliveryManager {
  private config: AzureStaticContentConfig;
  private blobClient: AzureBlobStorageClient;
  private cdnClient?: AzureCDNClient;
  private frontDoorClient?: AzureFrontDoorClient;

  constructor(config: AzureStaticContentConfig, accessToken?: string) {
    this.config = config;
    
    // Initialize Blob Storage client
    this.blobClient = new AzureBlobStorageClient({
      accountName: config.storageAccountName,
      containerName: '$web', // Static website container
    });

    // Initialize CDN client if enabled
    if (config.enableCDN && config.cdnProfileName && accessToken) {
      this.cdnClient = new AzureCDNClient({
        profileName: config.cdnProfileName,
        endpointName: `${config.storageAccountName}-website`,
        resourceGroupName: config.resourceGroupName,
        subscriptionId: config.subscriptionId,
      }, accessToken);
    }

    // Initialize Front Door client if enabled
    if (config.enableFrontDoor && config.frontDoorProfileName && accessToken) {
      this.frontDoorClient = new AzureFrontDoorClient({
        profileName: config.frontDoorProfileName,
        endpointName: config.frontDoorEndpointName || `${config.storageAccountName}-endpoint`,
        resourceGroupName: config.resourceGroupName,
        subscriptionId: config.subscriptionId,
      }, accessToken);
    }
  }

  /**
   * Deploy static website files
   */
  async deployStaticWebsite(
    files: { name: string; content: Buffer | string; contentType?: string }[],
    options: {
      purgeCDN?: boolean;
      purgeFrontDoor?: boolean;
      cacheControl?: string;
    } = {}
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deployedAssets: StaticAsset[] = [];
    const errors: string[] = [];

    try {
      // Upload files to blob storage
      for (const file of files) {
        try {
          const asset = await this.blobClient.uploadFile(file.name, file.content, {
            contentType: file.contentType || this.getContentType(file.name),
            cacheControl: options.cacheControl || this.getDefaultCacheControl(file.name),
          });
          deployedAssets.push(asset);
        } catch (error) {
          errors.push(`Failed to upload ${file.name}: ${error}`);
        }
      }

      // Purge CDN cache if requested
      let cdnPurged = false;
      if (options.purgeCDN && this.cdnClient) {
        try {
          const paths = files.map(f => `/${f.name}`);
          cdnPurged = await this.cdnClient.purgeCache(paths);
        } catch (error) {
          errors.push(`Failed to purge CDN cache: ${error}`);
        }
      }

      // Purge Front Door cache if requested
      let frontDoorPurged = false;
      if (options.purgeFrontDoor && this.frontDoorClient) {
        try {
          const paths = files.map(f => `/${f.name}`);
          const domains = []; // You would need to specify domains
          frontDoorPurged = await this.frontDoorClient.purgeCache(domains, paths);
        } catch (error) {
          errors.push(`Failed to purge Front Door cache: ${error}`);
        }
      }

      const totalSize = deployedAssets.reduce((sum, asset) => sum + asset.size, 0);
      const deploymentTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        deployedAssets,
        errors,
        cdnPurged,
        frontDoorPurged,
        totalSize,
        deploymentTime,
      };
    } catch (error) {
      errors.push(`Deployment failed: ${error}`);
      return {
        success: false,
        deployedAssets,
        errors,
        cdnPurged: false,
        frontDoorPurged: false,
        totalSize: 0,
        deploymentTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get delivery metrics from CDN and Front Door
   */
  async getDeliveryMetrics(
    startTime: Date,
    endTime: Date
  ): Promise<{ cdn?: ContentDeliveryMetrics; frontDoor?: ContentDeliveryMetrics }> {
    const metrics: any = {};

    if (this.cdnClient) {
      try {
        metrics.cdn = await this.cdnClient.getMetrics(startTime, endTime);
      } catch (error) {
        console.error('Error getting CDN metrics:', error);
      }
    }

    if (this.frontDoorClient) {
      try {
        metrics.frontDoor = await this.frontDoorClient.getMetrics(startTime, endTime);
      } catch (error) {
        console.error('Error getting Front Door metrics:', error);
      }
    }

    return metrics;
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
    };
    return contentTypes[extension || ''] || 'application/octet-stream';
  }

  private getDefaultCacheControl(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Static assets with versioning can be cached for a long time
    if (['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf'].includes(extension || '')) {
      return 'public, max-age=31536000'; // 1 year
    }
    
    // HTML files should have shorter cache times
    if (['html', 'htm'].includes(extension || '')) {
      return 'public, max-age=3600'; // 1 hour
    }
    
    return 'public, max-age=86400'; // 1 day default
  }
}

// Export types and classes
export default AzureStaticContentDeliveryManager;