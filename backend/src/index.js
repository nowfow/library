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

// Test database connection
async function testDatabaseConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('DB Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Don't log password
    });
    return false;
  }
}

app.use('/api/files', filesRouter);
app.use('/api/terms', termsRouter);
app.use('/api/works', worksRouter);
app.use('/api/auth', authRouter);
app.use('/api/collections', collectionsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

// Start server with database connection test
async function startServer() {
  console.log('🎵 Starting Music Library Backend...');
  
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will still start but may have issues.');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 