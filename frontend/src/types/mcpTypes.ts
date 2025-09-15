// TypeScript interfaces for MCP service
export interface CustomerData {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  socialSecurityNumber?: string;
  annualIncome: number;
  employmentStatus: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface LoanApplicationData extends CustomerData {
  loanAmount: number;
  loanType: 'personal' | 'mortgage' | 'auto' | 'business';
  purpose: string;
  term: number; // months
}

export interface WorkflowData {
  workflowId: string;
  type: string;
  parameters: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  domains: string[];
}

export interface TransactionData {
  transactionId: string;
  customerId: string;
  amount: number;
  currency: string;
  merchantId: string;
  merchantCategory: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
  };
  timestamp: string;
  paymentMethod: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoanApplicationResponse {
  applicationId: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  estimatedDecisionTime: string;
  nextSteps: string[];
}

export interface CreditDecisionResponse {
  applicationId: string;
  decision: 'approved' | 'rejected' | 'conditional';
  creditLimit?: number;
  interestRate?: number;
  conditions?: string[];
  riskScore: number;
}

export interface WorkflowCoordinationResponse {
  workflowId: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  orchestratedTasks: Array<{
    taskId: string;
    domain: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: unknown;
  }>;
  completionTime?: string;
}

export interface FraudDetectionResponse {
  riskScore: number;
  flagged: boolean;
  riskFactors: string[];
  recommendedAction: 'approve' | 'review' | 'decline';
  confidence: number;
}

export interface CreditRiskResponse {
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  creditScore: number;
  probabilityOfDefault: number;
  recommendedCreditLimit: number;
  riskFactors: string[];
}

export interface PortfolioRiskResponse {
  portfolioId: string;
  portfolioValue: number;
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  expectedShortfall: number;
  riskByCategory: Record<string, number>;
  lastUpdated: string;
}

export interface CustomerBehaviorAnalytics {
  segment: string;
  customerCount: number;
  avgTransactionVolume: number;
  avgTransactionFrequency: number;
  popularChannels: string[];
  seasonalTrends: Array<{
    month: string;
    transactionCount: number;
    totalVolume: number;
  }>;
  churnRisk: number;
}

export interface RiskMetricsDataProduct {
  portfolioId: string;
  overallRiskScore: number;
  metrics: Array<{
    riskType: string;
    value: number;
    threshold: number;
    status: 'normal' | 'warning' | 'critical';
  }>;
  lastCalculated: string;
}

export interface TransactionInsightsStream {
  timeWindow: number;
  totalCount: number;
  totalAmount: number;
  avgAmount: number;
  peakHour: string;
  topMerchantCategories: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
  fraudAlerts: number;
}

export interface McpServerStatus {
  healthy: boolean;
  totalServers: number;
  totalTools: number;
  toolsByDomain: Record<string, number>;
  uptimeSeconds: number;
  lastHealthCheck: string;
}

export interface McpTool {
  name: string;
  domain: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  lastUsed?: string;
  executionCount: number;
}

export interface McpEvent {
  id: string;
  type: 'WORKFLOW_STARTED' | 'TOOL_EXECUTED' | 'WORKFLOW_COMPLETED' | 'KAFKA_EVENT' | 'ERROR';
  domain: string;
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'warning';
  metadata?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: string;
  payload: McpEvent | McpServerStatus | unknown;
}

// Portfolio related interfaces
export interface PortfolioData {
  portfolioId: string;
  name: string;
  totalValue: number;
  lastUpdated: string;
}