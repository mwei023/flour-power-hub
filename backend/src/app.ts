import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection, healthCheck } from './config/database';
import customerRoutes from './routes/customerRoutes';
import transactionRoutes from './routes/transactionRoutes';
import expenseRoutes from './routes/expenseRoutes';
import tenderRoutes from './routes/tenderRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import mpesaRoutes from './routes/mpesaRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://amani.mwei.co.ke'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Trust proxy (only needed if behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API prefix
const API_PREFIX = process.env['API_PREFIX'] || '/api';
const API_VERSION = process.env['API_VERSION'] || 'v1';
const API_BASE_PATH = `${API_PREFIX}/${API_VERSION}`;

// Health check endpoint (at /health for direct access, and /api/v1/health for cloudflare)
app.get(`${API_BASE_PATH}/health`, async (_req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: NODE_ENV,
      database: dbHealth,
    });
  } catch (_error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: NODE_ENV,
      database: { status: 'unhealthy' },
      error: 'Database connection failed',
    });
  }
});

// Also keep the old health endpoint for local development
app.get('/health', async (_req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: NODE_ENV,
      database: dbHealth,
    });
  } catch (_error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: NODE_ENV,
      database: { status: 'unhealthy' },
      error: 'Database connection failed',
    });
  }
});

// API routes
app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/customers`, customerRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/tenders`, tenderRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/reports`, reportRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/payments`, mpesaRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Posho Mill Tracker API',
    version: API_VERSION,
    environment: NODE_ENV,
    documentation: 'See README.md for API documentation',
    endpoints: {
      health: '/health',
      customers: `${API_PREFIX}/${API_VERSION}/customers`,
      transactions: `${API_PREFIX}/${API_VERSION}/transactions`,
      expenses: `${API_PREFIX}/${API_VERSION}/expenses`,
      tenders: `${API_PREFIX}/${API_VERSION}/tenders`,
      reports: `${API_PREFIX}/${API_VERSION}/reports`,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = NODE_ENV === 'development';
  
  const error = err as { status?: number; message?: string; stack?: string };
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed. Server will start but may not work properly.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Posho Mill Tracker API server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
