// AI Inference Service - Core business logic
// File: /ai-microservice/src/services/ai-inference.service.ts

import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { ApplicationInsights } from 'applicationinsights';
import { Redis } from 'redis';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { logger } from '../utils/logger';

export interface AIInferenceRequest {
  requestId: string;
  userId: string;
  inferenceType: 'chat' | 'embedding' | 'vision' | 'personalization';
  payload: {
    messages?: Array<{ role: string; content: string }>;
    text?: string;
    imageUrl?: string;
    model?: string;
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface AIInferenceResponse {
  requestId: string;
  userId: string;
  success: boolean;
  result?: {
    content?: string;
    embedding?: number[];
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  metadata: {
    modelUsed: string;
    latencyMs: number;
    timestamp: number;
  };
  error?: string;
}

export class AIInferenceService {
  private azureOpenAI: AzureOpenAI | null = null;
  private redis: Redis | null = null;
  private kafka: Kafka | null = null;
  private kafkaProducer: Producer | null = null;
  private appInsights: ApplicationInsights | null = null;

  constructor(private config: any) {}

  async initialize(): Promise<void> {
    try {
      logger.info('🤖 Initializing AI Inference Service...');

      // Initialize Azure OpenAI
      await this.initializeAzureOpenAI();

      // Initialize Redis for caching
      await this.initializeRedis();

      // Initialize Kafka for event streaming
      await this.initializeKafka();

      // Initialize Application Insights
      this.initializeApplicationInsights();

      logger.info('✅ AI Inference Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize AI Inference Service:', error);
      throw error;
    }
  }

  private async initializeAzureOpenAI(): Promise<void> {
    try {
      if (this.config.apiKey) {
        // API Key authentication
        this.azureOpenAI = new AzureOpenAI({
          apiKey: this.config.apiKey,
          endpoint: this.config.endpoint,
          apiVersion: this.config.apiVersion || '2024-10-21'
        });
      } else {
        // Azure AD authentication
        const credential = new DefaultAzureCredential();
        const scope = 'https://cognitiveservices.azure.com/.default';
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        
        this.azureOpenAI = new AzureOpenAI({
          azureADTokenProvider,
          endpoint: this.config.endpoint,
          apiVersion: this.config.apiVersion || '2024-10-21'
        });
      }

      logger.info('✅ Azure OpenAI client initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Azure OpenAI:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redis?.host) {
      logger.info('⚠️ Redis not configured, skipping cache initialization');
      return;
    }

    try {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port || 6379,
        password: this.config.redis.password,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      await this.redis.ping();
      logger.info('✅ Redis cache initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Redis:', error);
      // Continue without Redis if it fails
      this.redis = null;
    }
  }

  private async initializeKafka(): Promise<void> {
    if (!this.config.kafka?.brokers) {
      logger.info('⚠️ Kafka not configured, skipping event streaming');
      return;
    }

    try {
      this.kafka = new Kafka({
        clientId: 'ai-inference-service',
        brokers: this.config.kafka.brokers,
        ssl: this.config.kafka.ssl || false,
        sasl: this.config.kafka.sasl || undefined
      });

      this.kafkaProducer = this.kafka.producer();
      await this.kafkaProducer.connect();

      logger.info('✅ Kafka event streaming initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Kafka:', error);
      // Continue without Kafka if it fails
      this.kafka = null;
      this.kafkaProducer = null;
    }
  }

  private initializeApplicationInsights(): void {
    if (!this.config.applicationInsights?.connectionString) {
      logger.info('⚠️ Application Insights not configured');
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: this.config.applicationInsights.connectionString
        }
      });
      this.appInsights.start();
      logger.info('✅ Application Insights initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Application Insights:', error);
    }
  }

  async performInference(request: AIInferenceRequest): Promise<AIInferenceResponse> {
    const startTime = Date.now();
    
    try {
      logger.info(`🧠 Processing AI inference request: ${request.requestId}`);

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = await this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        logger.info(`💾 Cache hit for request: ${request.requestId}`);
        return cachedResult;
      }

      // Perform actual inference
      let result;
      switch (request.inferenceType) {
        case 'chat':
          result = await this.performChatInference(request);
          break;
        case 'embedding':
          result = await this.performEmbeddingInference(request);
          break;
        default:
          throw new Error(`Unsupported inference type: ${request.inferenceType}`);
      }

      const response: AIInferenceResponse = {
        requestId: request.requestId,
        userId: request.userId,
        success: true,
        result,
        metadata: {
          modelUsed: request.payload.model || 'gpt-5-mini',
          latencyMs: Date.now() - startTime,
          timestamp: Date.now()
        }
      };

      // Cache the result
      await this.cacheResult(cacheKey, response);

      // Publish to Kafka
      await this.publishInferenceEvent(request, response);

      // Track in Application Insights
      this.trackInference(request, response);

      logger.info(`✅ AI inference completed: ${request.requestId} (${response.metadata.latencyMs}ms)`);
      return response;

    } catch (error) {
      logger.error(`❌ AI inference failed: ${request.requestId}`, error);
      
      return {
        requestId: request.requestId,
        userId: request.userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          modelUsed: request.payload.model || 'unknown',
          latencyMs: Date.now() - startTime,
          timestamp: Date.now()
        }
      };
    }
  }

  private async performChatInference(request: AIInferenceRequest): Promise<any> {
    if (!this.azureOpenAI) {
      throw new Error('Azure OpenAI not initialized');
    }

    const completion = await this.azureOpenAI.chat.completions.create({
      model: request.payload.model || 'gpt-5-mini',
      messages: request.payload.messages || [],
      temperature: request.options?.temperature || 0.7,
      max_tokens: request.options?.maxTokens || 1000,
      stream: false
    });

    return {
      content: completion.choices[0]?.message?.content,
      usage: completion.usage
    };
  }

  private async performEmbeddingInference(request: AIInferenceRequest): Promise<any> {
    if (!this.azureOpenAI) {
      throw new Error('Azure OpenAI not initialized');
    }

    const embedding = await this.azureOpenAI.embeddings.create({
      model: 'text-embedding-ada-002',
      input: request.payload.text || ''
    });

    return {
      embedding: embedding.data[0]?.embedding,
      usage: embedding.usage
    };
  }

  private generateCacheKey(request: AIInferenceRequest): string {
    return `ai:${request.inferenceType}:${Buffer.from(JSON.stringify(request.payload)).toString('base64')}`;
  }

  private async getCachedResult(cacheKey: string): Promise<AIInferenceResponse | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  private async cacheResult(cacheKey: string, response: AIInferenceResponse): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour TTL
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  private async publishInferenceEvent(request: AIInferenceRequest, response: AIInferenceResponse): Promise<void> {
    if (!this.kafkaProducer) return;

    try {
      await this.kafkaProducer.send({
        topic: 'ai-inference-events',
        messages: [{
          key: request.userId,
          value: JSON.stringify({ request, response }),
          timestamp: Date.now().toString()
        }]
      });
    } catch (error) {
      logger.error('Kafka publish error:', error);
    }
  }

  private trackInference(request: AIInferenceRequest, response: AIInferenceResponse): void {
    if (!this.appInsights) return;

    this.appInsights.trackEvent({
      name: 'AIInference',
      properties: {
        requestId: request.requestId,
        userId: request.userId,
        inferenceType: request.inferenceType,
        modelUsed: response.metadata.modelUsed,
        latencyMs: response.metadata.latencyMs.toString(),
        success: response.success.toString()
      }
    });
  }

  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down AI Inference Service...');
    
    if (this.kafkaProducer) {
      await this.kafkaProducer.disconnect();
    }
    
    if (this.redis) {
      await this.redis.quit();
    }

    logger.info('✅ AI Inference Service shutdown complete');
  }
}