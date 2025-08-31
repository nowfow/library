import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Enhanced logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[HIDDEN]';
    console.log(`[${timestamp}] Request body:`, JSON.stringify(logBody));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = new Date().toISOString();
    console.log(`[${endTime}] Response ${res.statusCode} to ${req.method} ${req.url}`);
    originalSend.apply(this, arguments);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${req.method} ${req.url}:`, {
    message: err.message,
    stack: err.stack,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
  next(err);
};

import filesRouter from './routes/files.js';
import termsRouter from './routes/terms.js';
import worksRouter from './routes/works.js';
import authRouter from './routes/auth.js';
import collectionsRouter from './routes/collections.js';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Enable detailed logging
app.use(requestLogger);
app.use(errorLogger);

// Test database connection with retries
async function testDatabaseConnection(maxRetries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [rows] = await pool.query('SELECT 1');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === 1) {
        console.error('DB Config:', {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          // Don't log password
        });
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('⚠️  All database connection attempts failed. Starting server anyway.');
  return false;
}

app.use('/api/files', filesRouter);
app.use('/api/terms', termsRouter);
app.use('/api/works', worksRouter);
app.use('/api/auth', authRouter);
app.use('/api/collections', collectionsRouter);

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Health check requested`);
  
  const health = {
    status: 'ok',
    timestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  // Test database connection (optional)
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - startTime;
    health.database = {
      status: 'connected',
      latency: `${dbLatency}ms`
    };
    console.log(`[${timestamp}] Database health check: OK (${dbLatency}ms)`);
  } catch (error) {
    health.database = {
      status: 'disconnected',
      error: error.message
    };
    console.error(`[${timestamp}] Database health check: FAILED -`, error.message);
  }
  
  console.log(`[${timestamp}] Health check response:`, health);
  res.json(health);
});

const PORT = process.env.PORT || 3000;

// Start server with database connection test
async function startServer() {
  console.log('🎵 Starting Music Library Backend...');
  console.log('💪 Node.js version:', process.version);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  
  // Test database connection (but don't fail if it's not available)
  console.log('💾 Testing database connection...');
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log('⚠️  Database not available - server will start but some features may not work');
  }
  
  // Start HTTP server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log('✅ Server started successfully!');
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('🛱 Received SIGTERM signal, shutting down gracefully...');
    server.close(() => {
      console.log('🛱 Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛱 Received SIGINT signal, shutting down gracefully...');
    server.close(() => {
      console.log('🛱 Server closed');
      process.exit(0);
    });
  });
  
  return server;
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 