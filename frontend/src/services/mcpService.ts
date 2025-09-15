// MCP API Service for demo frontend integration
import axios from 'axios';
import {
  CustomerData,
  LoanApplicationData,
  WorkflowData,
  TransactionData,
  ApiResponse,
  LoanApplicationResponse,
  CreditDecisionResponse,
  WorkflowCoordinationResponse,
  FraudDetectionResponse,
  CreditRiskResponse,
  PortfolioRiskResponse,
  CustomerBehaviorAnalytics,
  RiskMetricsDataProduct,
  TransactionInsightsStream,
  McpServerStatus,
  McpTool,
  McpEvent,
  WebSocketMessage
} from '../types/mcpTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
);

// MCP Tool Execution Service
export const mcpService = {
  // Customer Journey Automation
  async startLoanApplication(customerData: LoanApplicationData): Promise<ApiResponse<LoanApplicationResponse>> {
    try {
      const response = await apiClient.post('/api/mcp/journey/start-loan-application', customerData);
      return response.data;
    } catch {
      return {
        success: false,
        error: 'Failed to start loan application',
        message: 'Demo mode - simulated response'
      };
    }
  },

  async processCreditDecision(applicationId: string): Promise<ApiResponse<CreditDecisionResponse>> {
    try {
      const response = await apiClient.post(`/api/mcp/journey/process-credit-decision/${applicationId}`);
      return response.data;
    } catch {
      return {
        success: false,
        error: 'Failed to process credit decision',
        message: 'Demo mode - simulated response'
      };
    }
  },

  async coordinateMultiDomain(workflowData: WorkflowData): Promise<ApiResponse<WorkflowCoordinationResponse>> {
    try {
      const response = await apiClient.post('/api/mcp/journey/coordinate-multi-domain', workflowData);
      return response.data;
    } catch {
      return {
        success: false,
        error: 'Failed to coordinate multi-domain workflow',
        message: 'Demo mode - simulated response'
      };
    }
  },

  // Real-time Risk Management
  async detectTransactionFraud(transactionData: TransactionData): Promise<ApiResponse<FraudDetectionResponse>> {
    try {
      const response = await apiClient.post('/api/mcp/ai-inference/detect-fraud', transactionData);
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          riskScore: Math.random() * 0.5,
          flagged: false,
          riskFactors: [],
          recommendedAction: 'approve',
          confidence: 0.95
        },
        message: 'Demo mode - simulated fraud detection'
      };
    }
  },

  async assessCreditRisk(customerData: CustomerData): Promise<ApiResponse<CreditRiskResponse>> {
    try {
      const response = await apiClient.post('/api/mcp/ai-inference/assess-credit-risk', customerData);
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          riskCategory: 'MEDIUM',
          creditScore: 680 + Math.floor(Math.random() * 120),
          probabilityOfDefault: 0.05,
          recommendedCreditLimit: 25000,
          riskFactors: ['Limited credit history']
        },
        message: 'Demo mode - simulated credit assessment'
      };
    }
  },

  async analyzePortfolioRisk(portfolioId: string): Promise<ApiResponse<PortfolioRiskResponse>> {
    try {
      const response = await apiClient.get(`/api/mcp/ai-inference/portfolio-risk/${portfolioId}`);
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          portfolioId,
          portfolioValue: 125000000,
          var95: 2800000,
          var99: 4200000,
          expectedShortfall: 5100000,
          riskByCategory: {
            'equity': 0.15,
            'fixed-income': 0.08,
            'alternatives': 0.22
          },
          lastUpdated: new Date().toISOString()
        },
        message: 'Demo mode - simulated portfolio analysis'
      };
    }
  },

  // Data-Driven Insights
  async getCustomerBehaviorAnalytics(segment: string, startDate: string, endDate: string): Promise<ApiResponse<CustomerBehaviorAnalytics>> {
    try {
      const response = await apiClient.get('/api/mcp/data-products/customer-behavior', {
        params: { segment, startDate, endDate }
      });
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          segment,
          customerCount: 5420,
          avgTransactionVolume: 15000.50,
          avgTransactionFrequency: 8.3,
          popularChannels: ['mobile', 'web', 'atm'],
          seasonalTrends: [
            { month: 'Jan', transactionCount: 145000, totalVolume: 12500000 },
            { month: 'Feb', transactionCount: 138000, totalVolume: 11800000 }
          ],
          churnRisk: 0.12
        },
        message: 'Demo mode - simulated customer analytics'
      };
    }
  },

  async getRiskMetricsDataProduct(portfolioId: string, riskTypes: string): Promise<ApiResponse<RiskMetricsDataProduct>> {
    try {
      const response = await apiClient.get('/api/mcp/data-products/risk-metrics', {
        params: { portfolioId, riskTypes }
      });
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          portfolioId,
          overallRiskScore: 0.35,
          metrics: [
            { riskType: 'market', value: 0.18, threshold: 0.25, status: 'normal' },
            { riskType: 'credit', value: 0.12, threshold: 0.15, status: 'normal' }
          ],
          lastCalculated: new Date().toISOString()
        },
        message: 'Demo mode - simulated risk metrics'
      };
    }
  },

  async getTransactionInsightsStream(timeWindowMinutes: number): Promise<ApiResponse<TransactionInsightsStream>> {
    try {
      const response = await apiClient.get('/api/mcp/data-products/transaction-insights', {
        params: { timeWindowMinutes }
      });
      return response.data;
    } catch {
      return {
        success: false,
        data: {
          timeWindow: timeWindowMinutes,
          totalCount: 15420,
          totalAmount: 12500000.75,
          avgAmount: 810.25,
          peakHour: '14:00',
          topMerchantCategories: [
            { category: 'grocery', count: 3200, amount: 1200000 },
            { category: 'gas', count: 2800, amount: 850000 }
          ],
          fraudAlerts: 12
        },
        message: 'Demo mode - simulated transaction insights'
      };
    }
  },

  // MCP Registry and Health
  async getMcpServerStatus(): Promise<ApiResponse<McpServerStatus>> {
    try {
      const response = await apiClient.get('/api/mcp/registry/health');
      return response.data;
    } catch {
      return {
        success: true,
        data: {
          healthy: true,
          totalServers: 4,
          totalTools: 35,
          toolsByDomain: {
            'user-management': 8,
            'journey-orchestration': 12,
            'ai-inference': 6,
            'data-products': 9
          },
          uptimeSeconds: 86400,
          lastHealthCheck: new Date().toISOString()
        },
        message: 'Demo mode - simulated MCP status'
      };
    }
  },

  async getRegisteredTools(): Promise<ApiResponse<McpTool[]>> {
    try {
      const response = await apiClient.get('/api/mcp/registry/tools');
      return response.data;
    } catch {
      return {
        success: true,
        data: [
          { name: 'get_user_profile', domain: 'user-management', status: 'active', executionCount: 1250 },
          { name: 'start_loan_application_journey', domain: 'journey-orchestration', status: 'active', executionCount: 89 },
          { name: 'detect_transaction_fraud', domain: 'ai-inference', status: 'active', executionCount: 15420 },
          { name: 'get_customer_behavior_analytics', domain: 'data-products', status: 'active', executionCount: 342 }
        ],
        message: 'Demo mode - simulated tool registry'
      };
    }
  }
};

// WebSocket service for real-time updates
export class McpWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  connect(onMessage: (data: McpEvent) => void, onError?: (error: Event) => void): void {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/mcp-events';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('MCP WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as McpEvent;
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('MCP WebSocket disconnected');
        this.attemptReconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error('MCP WebSocket error:', error);
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      // In demo mode, simulate real-time events
      this.simulateRealTimeEvents(onMessage);
    }
  }

  private attemptReconnect(onMessage: (data: McpEvent) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private simulateRealTimeEvents(onMessage: (data: McpEvent) => void): void {
    // Simulate real-time events for demo purposes
    const eventTypes: McpEvent['type'][] = ['WORKFLOW_STARTED', 'TOOL_EXECUTED', 'WORKFLOW_COMPLETED', 'KAFKA_EVENT'];
    const domains = ['user-management', 'journey-orchestration', 'ai-inference', 'data-products'];

    setInterval(() => {
      if (Math.random() > 0.7) {
        const event: McpEvent = {
          id: `EVT-${Date.now()}`,
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          domain: domains[Math.floor(Math.random() * domains.length)],
          timestamp: new Date().toISOString(),
          message: 'Simulated real-time event',
          status: Math.random() > 0.9 ? 'error' : 'success'
        };
        onMessage(event);
      }
    }, 2000);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export default mcpService;