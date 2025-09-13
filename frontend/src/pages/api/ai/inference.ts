// Next.js API Route for AI Inference
// File: /frontend/src/pages/api/ai/inference.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { RealTimeAIInferenceClient, AIInferenceRequest, AIInferenceResponse } from '@/lib/ai-realtime-inference-sdk';

// Initialize AI client with environment variables
const aiClient = new RealTimeAIInferenceClient({
  aiFoundry: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://your-ai-foundry.openai.azure.com/',
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: 'gpt-5-mini',
    modelDeployments: [
      {
        name: 'gpt-5-mini',
        purpose: 'text-generation',
        deployment: 'gpt-5-mini'
      },
      {
        name: 'text-embedding-ada-002',
        purpose: 'embeddings',
        deployment: 'text-embedding-ada-002'
      }
    ]
  },
  confluent: {
    bootstrapServers: process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092',
    apiKey: process.env.KAFKA_API_KEY,
    apiSecret: process.env.KAFKA_API_SECRET,
    topics: {
      userEvents: 'user-events',
      aiInferenceRequests: 'ai-inference-requests',
      aiInferenceResponses: 'ai-inference-responses',
      personalizationEvents: 'personalization-events',
      realTimeFeatures: 'realtime-features'
    }
  },
  applicationInsights: {
    connectionString: process.env.APPINSIGHTS_CONNECTION_STRING || ''
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIInferenceResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const inferenceRequest: AIInferenceRequest = {
      requestId: `req_${Date.now()}`,
      userId: req.body.userId || 'anonymous',
      inferenceType: req.body.inferenceType || 'chat',
      context: {
        userId: req.body.userId || 'anonymous',
        sessionId: `session_${Date.now()}`,
        deviceType: 'desktop',
        ...req.body.context
      },
      payload: req.body.payload || {},
      options: req.body.options || {}
    };

    // Perform inference using AI SDK
    const response = await aiClient.performInference(inferenceRequest);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('AI Inference error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'AI inference failed' 
    });
  }
}