import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface CustomerJourneyDemoProps {
  isAgenticMode: boolean;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  mcpTool: string;
  duration?: number;
  result?: any;
  icon: React.ComponentType<{ className?: string }>;
}

interface LoanApplication {
  id: string;
  customerName: string;
  amount: number;
  type: string;
  status: string;
  steps: WorkflowStep[];
  createdAt: string;
}

const CustomerJourneyDemo: React.FC<CustomerJourneyDemoProps> = ({ isAgenticMode }) => {
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);

  const mockApplications: LoanApplication[] = [
    {
      id: 'LA-2025-001',
      customerName: 'Sarah Johnson',
      amount: 250000,
      type: 'Home Loan',
      status: 'In Progress',
      createdAt: '2025-09-15T10:30:00Z',
      steps: [
        {
          id: 'validate_user',
          name: 'User Validation',
          description: 'Validate customer profile and eligibility',
          status: 'completed',
          mcpTool: 'get_user_profile',
          duration: 2.1,
          result: { creditScore: 750, income: 85000, verified: true },
          icon: UserIcon
        },
        {
          id: 'fraud_check',
          name: 'Fraud Detection',
          description: 'AI-powered fraud detection analysis',
          status: 'in-progress',
          mcpTool: 'detect_transaction_fraud',
          icon: ShieldCheckIcon
        },
        {
          id: 'credit_assessment',
          name: 'Credit Risk Assessment',
          description: 'Comprehensive credit risk evaluation',
          status: 'pending',
          mcpTool: 'assess_credit_risk',
          icon: ChartBarIcon
        },
        {
          id: 'coordinate_approval',
          name: 'Multi-Domain Coordination',
          description: 'Coordinate approval across departments',
          status: 'pending',
          mcpTool: 'coordinate_multi_domain_workflow',
          icon: CogIcon
        }
      ]
    },
    {
      id: 'LA-2025-002',
      customerName: 'Michael Chen',
      amount: 50000,
      type: 'Personal Loan',
      status: 'Completed',
      createdAt: '2025-09-15T09:15:00Z',
      steps: [
        {
          id: 'validate_user',
          name: 'User Validation',
          description: 'Validate customer profile and eligibility',
          status: 'completed',
          mcpTool: 'get_user_profile',
          duration: 1.8,
          result: { creditScore: 720, income: 65000, verified: true },
          icon: UserIcon
        },
        {
          id: 'fraud_check',
          name: 'Fraud Detection',
          description: 'AI-powered fraud detection analysis',
          status: 'completed',
          mcpTool: 'detect_transaction_fraud',
          duration: 3.2,
          result: { riskScore: 0.15, flagged: false },
          icon: ShieldCheckIcon
        },
        {
          id: 'credit_assessment',
          name: 'Credit Risk Assessment',
          description: 'Comprehensive credit risk evaluation',
          status: 'completed',
          mcpTool: 'assess_credit_risk',
          duration: 4.5,
          result: { riskCategory: 'LOW', approvedAmount: 50000 },
          icon: ChartBarIcon
        },
        {
          id: 'coordinate_approval',
          name: 'Multi-Domain Coordination',
          description: 'Coordinate approval across departments',
          status: 'completed',
          mcpTool: 'coordinate_multi_domain_workflow',
          duration: 2.8,
          result: { approved: true, finalAmount: 50000 },
          icon: CogIcon
        }
      ]
    }
  ];

  const startNewLoanApplication = async () => {
    setIsProcessing(true);
    setWorkflowLogs([]);
    
    const newApplication: LoanApplication = {
      id: `LA-2025-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      customerName: 'Demo Customer',
      amount: 150000,
      type: 'Auto Loan',
      status: 'Processing',
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'validate_user',
          name: 'User Validation',
          description: 'Validate customer profile and eligibility',
          status: 'pending',
          mcpTool: 'get_user_profile',
          icon: UserIcon
        },
        {
          id: 'fraud_check',
          name: 'Fraud Detection',
          description: 'AI-powered fraud detection analysis',
          status: 'pending',
          mcpTool: 'detect_transaction_fraud',
          icon: ShieldCheckIcon
        },
        {
          id: 'credit_assessment',
          name: 'Credit Risk Assessment',
          description: 'Comprehensive credit risk evaluation',
          status: 'pending',
          mcpTool: 'assess_credit_risk',
          icon: ChartBarIcon
        },
        {
          id: 'coordinate_approval',
          name: 'Multi-Domain Coordination',
          description: 'Coordinate approval across departments',
          status: 'pending',
          mcpTool: 'coordinate_multi_domain_workflow',
          icon: CogIcon
        }
      ]
    };

    setSelectedApplication(newApplication);
    addWorkflowLog(`🚀 Starting loan application workflow for ${newApplication.id}`);
    
    if (isAgenticMode) {
      addWorkflowLog('🤖 AI Agent taking control of workflow execution');
      addWorkflowLog('📡 Publishing LOAN_APPLICATION_STARTED event to Kafka');
    }

    // Simulate workflow execution
    for (let i = 0; i < newApplication.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedApplication = { ...newApplication };
      updatedApplication.steps[i].status = 'in-progress';
      setSelectedApplication(updatedApplication);
      
      addWorkflowLog(`⚡ Executing MCP tool: ${updatedApplication.steps[i].mcpTool}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      updatedApplication.steps[i].status = 'completed';
      updatedApplication.steps[i].duration = Math.random() * 3 + 1;
      
      switch (i) {
        case 0:
          updatedApplication.steps[i].result = { creditScore: 680, income: 75000, verified: true };
          addWorkflowLog('✅ User validation completed - Credit score: 680');
          break;
        case 1:
          updatedApplication.steps[i].result = { riskScore: 0.25, flagged: false };
          addWorkflowLog('🛡️ Fraud detection completed - Low risk detected');
          break;
        case 2:
          updatedApplication.steps[i].result = { riskCategory: 'MEDIUM', approvedAmount: 135000 };
          addWorkflowLog('📊 Credit assessment completed - Medium risk, approved $135K');
          break;
        case 3:
          updatedApplication.steps[i].result = { approved: true, finalAmount: 135000 };
          addWorkflowLog('🎉 Multi-domain coordination completed - Application approved!');
          break;
      }
      
      setSelectedApplication({ ...updatedApplication });
      
      if (isAgenticMode) {
        addWorkflowLog(`📡 Publishing ${updatedApplication.steps[i].name.toUpperCase()}_COMPLETED event`);
      }
    }
    
    addWorkflowLog('🏁 Loan application workflow completed successfully');
    setIsProcessing(false);
  };

  const addWorkflowLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setWorkflowLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Journey Automation</h2>
          <p className="text-gray-600 mt-1">
            Intelligent loan application workflows with multi-domain coordination
          </p>
        </div>
        
        <button
          onClick={startNewLoanApplication}
          disabled={isProcessing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayIcon className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : 'Start New Application'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application List */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {mockApplications.map((app) => (
              <motion.div
                key={app.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedApplication(app)}
                className={`p-4 bg-white rounded-lg cursor-pointer border-2 transition-colors ${
                  selectedApplication?.id === app.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{app.id}</h4>
                    <p className="text-sm text-gray-600">{app.customerName}</p>
                    <p className="text-sm text-gray-500">{app.type} - ${app.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      app.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workflow Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Status</h3>
          
          {selectedApplication ? (
            <div className="space-y-4">
              {/* Application Info */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">{selectedApplication.id}</h4>
                <p className="text-sm text-gray-600">{selectedApplication.customerName}</p>
                <p className="text-sm text-gray-500">
                  {selectedApplication.type} - ${selectedApplication.amount.toLocaleString()}
                </p>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-3">
                {selectedApplication.steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-4 rounded-lg border-l-4 border-gray-200"
                      style={{
                        borderLeftColor: 
                          step.status === 'completed' ? '#10b981' :
                          step.status === 'in-progress' ? '#3b82f6' :
                          step.status === 'failed' ? '#ef4444' : '#d1d5db'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="h-6 w-6 text-gray-600 mr-3" />
                          <div>
                            <h5 className="font-medium text-gray-900">{step.name}</h5>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            <p className="text-xs text-gray-500 mt-1">MCP Tool: {step.mcpTool}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {step.duration && (
                            <span className="text-xs text-gray-500">{step.duration.toFixed(1)}s</span>
                          )}
                          {getStatusIcon(step.status)}
                        </div>
                      </div>
                      
                      {step.result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-2 bg-gray-50 rounded text-xs"
                        >
                          <pre className="text-gray-700">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select an application to view workflow details
            </div>
          )}
        </div>
      </div>

      {/* Workflow Logs */}
      {workflowLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gray-900 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3">
            {isAgenticMode ? '🤖 Agentic Workflow Logs' : '📝 Workflow Logs'}
          </h3>
          <div className="bg-gray-800 rounded p-3 max-h-64 overflow-y-auto">
            {workflowLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-300 font-mono"
              >
                {log}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerJourneyDemo;