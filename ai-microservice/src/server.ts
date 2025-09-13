// Standalone AI Inference Microservice
// File: /ai-microservice/src/server.ts

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { AIInferenceService } from './services/ai-inference.service';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { logger } from './utils/logger';
import { config } from './config';

class AIInferenceMicroservice {
  private app: express.Application;
  private server: any;
  private aiService: AIInferenceService;

  constructor() {
    this.app = express();
    this.aiService = new AIInferenceService(config.ai);
    this.setupApp();
  }

  private setupApp(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // General middleware
    this.app.use(compression());
    this.app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    setupMiddleware(this.app);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ai-inference-microservice',
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    setupRoutes(this.app, this.aiService);

    // Error handling
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        requestId: req.headers['x-request-id']
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize AI service
      await this.aiService.initialize();

      // Start server
      this.server = createServer(this.app);
      
      this.server.listen(config.server.port, () => {
        logger.info(`🚀 AI Inference Microservice started on port ${config.server.port}`);
        logger.info(`📊 Health check: http://localhost:${config.server.port}/health`);
        logger.info(`🤖 AI Endpoints: http://localhost:${config.server.port}/api/v1/ai`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start AI microservice:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down AI Inference Microservice...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('✅ HTTP server closed');
      });
    }

    await this.aiService.shutdown();
    process.exit(0);
  }
}

// Start the microservice
const service = new AIInferenceMicroservice();
service.start().catch((error) => {
  logger.error('Failed to start service:', error);
  process.exit(1);
});