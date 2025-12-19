require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - Required when running behind Nginx or other reverse proxy
// Set to 1 to trust only the first proxy (Nginx), which is more secure
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3001', 'http://47.250.126.192', 'https://tmybaiki.amastsales-sandbox.com', 'http://tmybaiki.amastsales-sandbox.com'];

// Log allowed origins for debugging
logger.info('CORS Allowed Origins:', { origins: allowedOrigins });

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.info('CORS: No origin header, allowing request');
      return callback(null, true);
    }
    
    logger.info('CORS: Request from origin:', { origin });
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      logger.info('CORS: Origin allowed');
      callback(null, true);
    } else {
      logger.warn('CORS: Origin not in allowed list, but allowing anyway', { origin, allowedOrigins });
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting - More permissive for authenticated API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP/user to 2000 requests per 15 minutes (very permissive for CRM usage)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  },
  // Skip trust proxy validation since we're behind Nginx (trust proxy: 1 is set)
  validate: {
    trustProxy: false // Skip validation - we trust Nginx as the first proxy
  },
  // Note: Using IP-based limiting since authentication happens in route middleware
  // The limit is permissive enough (2000 req/15min) to handle normal CRM usage
  // This is approximately 2.2 requests per second, which is very reasonable
});

// Rate limiting - Stricter for auth routes (to prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per 15 minutes (increased from 10)
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Skip trust proxy validation since we're behind Nginx (trust proxy: 1 is set)
  validate: {
    trustProxy: false // Skip validation - we trust Nginx as the first proxy
  }
});

// Apply API rate limiter to all routes except auth
app.use('/api/', (req, res, next) => {
  // Skip API limiter for all auth routes (they use authLimiter)
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const database = require('./config/database');

async function startServer() {
  try {
    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      
      // Initialize default admin on startup
      const UserService = require('./services/UserService');
      UserService.initializeDefaultAdmin()
        .then(() => {
          logger.info('Default admin initialization completed');
        })
        .catch((error) => {
          logger.error('Error initializing default admin:', error);
        });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

