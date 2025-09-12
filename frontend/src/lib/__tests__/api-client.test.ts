import { apiClient, HealthStatus } from '../api-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('ApiClient', () => {
  describe('constructor', () => {
    it('should create axios instance with correct default config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use environment variable for base URL when available', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
      
      // Re-import to get new instance with updated env
      jest.resetModules();
      
      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    });
  });

  describe('getHealth', () => {
    it('should return health status from actuator endpoint', async () => {
      const mockHealthResponse: HealthStatus = {
        status: 'UP',
        timestamp: '2025-09-11T15:00:00Z',
        service: 'Golden Path Backend',
        version: '1.0.0',
      };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockHealthResponse }),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await apiClient.getHealth();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/actuator/health');
      expect(result).toEqual(mockHealthResponse);
    });

    it('should fallback to custom health endpoint when actuator fails', async () => {
      const mockHealthResponse: HealthStatus = {
        status: 'UP',
        timestamp: '2025-09-11T15:00:00Z',
        service: 'Golden Path Backend',
        version: '1.0.0',
      };

      const mockAxiosInstance = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Actuator not available'))
          .mockResolvedValueOnce({ data: mockHealthResponse }),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await apiClient.getHealth();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/actuator/health');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(mockHealthResponse);
    });

    it('should throw error when both endpoints fail', async () => {
      const mockAxiosInstance = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Actuator not available'))
          .mockRejectedValueOnce(new Error('Custom endpoint not available')),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await expect(apiClient.getHealth()).rejects.toThrow('Backend service unavailable');
    });
  });

  describe('getInfo', () => {
    it('should return info from actuator endpoint', async () => {
      const mockInfoResponse = {
        app: 'Golden Path Template',
        version: '1.0.0',
        environment: 'development',
      };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockInfoResponse }),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await apiClient.getInfo();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/actuator/info');
      expect(result).toEqual(mockInfoResponse);
    });
  });

  describe('authentication methods', () => {
    it('should call login endpoint with credentials', async () => {
      const credentials = { username: 'test', password: 'password' };
      const mockResponse = { token: 'jwt-token', user: { id: 1, username: 'test' } };

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await apiClient.login(credentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should call logout endpoint', async () => {
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({}),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await apiClient.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('generic HTTP methods', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it('should make GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await apiClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test');
      expect(result).toEqual(mockData);
    });

    it('should make POST requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      const requestData = { name: 'Test' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockData });

      const result = await apiClient.post('/test', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData);
      expect(result).toEqual(mockData);
    });

    it('should make PUT requests', async () => {
      const mockData = { id: 1, name: 'Updated Test' };
      const requestData = { name: 'Updated Test' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockData });

      const result = await apiClient.put('/test/1', requestData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', requestData);
      expect(result).toEqual(mockData);
    });

    it('should make DELETE requests', async () => {
      const mockData = { success: true };
      mockAxiosInstance.delete.mockResolvedValue({ data: mockData });

      const result = await apiClient.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1');
      expect(result).toEqual(mockData);
    });
  });
});
