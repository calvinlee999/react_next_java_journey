/**
 * Azure API Management Gateway Integration for REST API Client
 * Enhanced REST API client that routes through Azure API Management Gateway
 */

export interface APIGatewayRestOptions {
  /** Azure API Management Gateway URL */
  gatewayUrl?: string;
  /** API Management subscription key */
  subscriptionKey?: string;
  /** Azure AD access token for authentication */
  accessToken?: string;
  /** API version */
  apiVersion?: string;
  /** Enable Azure API Management specific features */
  useAPIManagement?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable retry on failure */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId?: string;
  timestamp: number;
  cached?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enhanced REST API client for Azure API Management Gateway
 */
export class APIGatewayRestClient {
  private readonly gatewayUrl: string;
  private subscriptionKey?: string;
  private accessToken?: string;
  private readonly apiVersion: string;
  private readonly useAPIManagement: boolean;
  private readonly timeout: number;
  private readonly enableRetry: boolean;
  private readonly maxRetries: number;

  constructor(options: APIGatewayRestOptions = {}) {
    // Default Azure API Management REST URL
    const defaultGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://localhost:3000';
    
    this.gatewayUrl = options.gatewayUrl || defaultGatewayUrl;
    this.subscriptionKey = options.subscriptionKey || process.env.NEXT_PUBLIC_APIM_SUBSCRIPTION_KEY;
    this.accessToken = options.accessToken;
    this.apiVersion = options.apiVersion || 'v1';
    this.useAPIManagement = options.useAPIManagement !== false;
    this.timeout = options.timeout || 30000;
    this.enableRetry = options.enableRetry !== false;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Build API URL with Azure API Management parameters
   */
  private buildApiUrl(endpoint: string): string {
    if (!this.useAPIManagement) {
      return `${this.gatewayUrl}${endpoint}`;
    }

    const baseUrl = this.gatewayUrl.endsWith('/') ? this.gatewayUrl.slice(0, -1) : this.gatewayUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const apiUrl = new URL(`${baseUrl}/api${cleanEndpoint}`);
    
    if (this.apiVersion) {
      apiUrl.searchParams.set('api-version', this.apiVersion);
    }

    return apiUrl.toString();
  }

  /**
   * Build request headers with Azure API Management authentication
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client': 'api-gateway-rest-client',
      'X-Timestamp': Date.now().toString(),
      ...customHeaders
    };

    // Add API Management subscription key
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    // Add Azure AD access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with retry logic and API Management features
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<APIResponse<T>> {
    const url = this.buildApiUrl(endpoint);
    const headers = this.buildHeaders(customHeaders);
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    headers['X-Request-ID'] = requestId;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        console.log(`🌐 ${method} ${url} (attempt ${attempt + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseData: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = (await response.text()) as unknown as T;
        }

        const apiResponse: APIResponse<T> = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          requestId,
          timestamp: Date.now(),
          cached: responseHeaders['x-cache-status'] === 'HIT'
        };

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ ${method} ${url} - ${response.status}`);
        return apiResponse;

      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.enableRetry || attempt > this.maxRetries) {
          break;
        }

        console.warn(`⚠️ ${method} ${url} failed (attempt ${attempt}), retrying...`, error);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`❌ ${method} ${url} failed after ${attempt} attempts`);
    throw lastError || new Error('Request failed');
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, undefined, headers);
  }

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, headers);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, headers);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, data, headers);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, headers);
  }

  /**
   * User Management API - Get all users
   */
  async getUsers(): Promise<APIResponse<User[]>> {
    return this.get<User[]>('/users');
  }

  /**
   * User Management API - Get user by ID
   */
  async getUser(id: string): Promise<APIResponse<User>> {
    return this.get<User>(`/users/${id}`);
  }

  /**
   * User Management API - Create new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<User>> {
    return this.post<User>('/users', userData);
  }

  /**
   * User Management API - Update user
   */
  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<APIResponse<User>> {
    return this.put<User>(`/users/${id}`, userData);
  }

  /**
   * User Management API - Delete user
   */
  async deleteUser(id: string): Promise<APIResponse<{ success: boolean }>> {
    return this.delete<{ success: boolean }>(`/users/${id}`);
  }

  /**
   * Authentication API - Login
   */
  async login(email: string, password: string): Promise<APIResponse<{ token: string; user: User }>> {
    return this.post<{ token: string; user: User }>('/auth/login', { email, password });
  }

  /**
   * Authentication API - Logout
   */
  async logout(): Promise<APIResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>('/auth/logout');
  }

  /**
   * Authentication API - Refresh token
   */
  async refreshToken(): Promise<APIResponse<{ token: string }>> {
    return this.post<{ token: string }>('/auth/refresh');
  }

  /**
   * Health check API
   */
  async healthCheck(): Promise<APIResponse<{
    status: string;
    timestamp: number;
    version: string;
    gateway: string;
  }>> {
    return this.get<{
      status: string;
      timestamp: number;
      version: string;
      gateway: string;
    }>('/health');
  }

  /**
   * Get API metrics and monitoring data
   */
  async getMetrics(): Promise<APIResponse<{
    requests: number;
    errors: number;
    averageResponseTime: number;
    cacheHitRatio: number;
    timestamp: number;
  }>> {
    return this.get<{
      requests: number;
      errors: number;
      averageResponseTime: number;
      cacheHitRatio: number;
      timestamp: number;
    }>('/metrics');
  }

  /**
   * Generic API call with custom endpoint
   */
  async call<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(method, endpoint, data, headers);
  }

  /**
   * Set Azure AD access token for authentication
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set API Management subscription key
   */
  setSubscriptionKey(key: string): void {
    this.subscriptionKey = key;
  }

  /**
   * Get the current API Management gateway configuration
   */
  getGatewayInfo(): {
    gatewayUrl: string;
    apiVersion: string;
    useAPIManagement: boolean;
    hasSubscriptionKey: boolean;
    hasAccessToken: boolean;
    timeout: number;
    enableRetry: boolean;
    maxRetries: number;
  } {
    return {
      gatewayUrl: this.gatewayUrl,
      apiVersion: this.apiVersion,
      useAPIManagement: this.useAPIManagement,
      hasSubscriptionKey: !!this.subscriptionKey,
      hasAccessToken: !!this.accessToken,
      timeout: this.timeout,
      enableRetry: this.enableRetry,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Upload file through API Management Gateway
   */
  async uploadFile(
    endpoint: string,
    file: File | Blob,
    fieldName = 'file',
    additionalData?: Record<string, string>
  ): Promise<APIResponse<{ url: string; id: string }>> {
    const url = this.buildApiUrl(endpoint);
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'X-Client': 'api-gateway-rest-client',
      'X-Request-ID': requestId,
      'X-Timestamp': Date.now().toString()
    };

    // Add API Management subscription key
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    // Add Azure AD access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Don't set Content-Type for FormData, let browser set it with boundary

    try {
      console.log(`📤 Uploading file to ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseData = await response.json();

      const apiResponse: APIResponse<{ url: string; id: string }> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        requestId,
        timestamp: Date.now()
      };

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ File uploaded successfully - ${response.status}`);
      return apiResponse;

    } catch (error) {
      console.error(`❌ File upload failed:`, error);
      throw error;
    }
  }
}

/**
 * Create an Azure API Management REST client instance
 */
export function createAPIGatewayRestClient(options?: APIGatewayRestOptions): APIGatewayRestClient {
  return new APIGatewayRestClient(options);
}

export default APIGatewayRestClient;