import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import filesRouter from './routes/files.js';
import termsRouter from './routes/terms.js';
import worksRouter from './routes/works.js';
import authRouter from './routes/auth.js';
import collectionsRouter from './routes/collections.js';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };
  
  // Test database connection (optional)
  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.database_error = error.message;
  }
  
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