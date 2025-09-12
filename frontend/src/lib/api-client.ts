import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment?: string[];
  port?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.get<HealthStatus>('/actuator/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      // Fallback to custom health endpoint
      try {
        const fallbackResponse = await this.client.get<HealthStatus>('/api/health');
        return fallbackResponse.data;
      } catch (fallbackError) {
        throw new Error('Backend service unavailable');
      }
    }
  }

  async getInfo(): Promise<any> {
    const response = await this.client.get('/actuator/info');
    return response.data;
  }

  async getStatus(): Promise<any> {
    const response = await this.client.get('/api/status');
    return response.data;
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<any> {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  // Generic API methods
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
