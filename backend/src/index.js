import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import session from 'express-session';
import { testDatabaseConnection, pool } from './db.js';
import logger from './utils/logger.js';
import { logUserActivity } from './middleware/auth.js';
import passport from './middleware/google-auth.js';

// Инициализация переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для безопасности
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Отключаем для разработки
}));

// CORS конфигурация
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Сжатие ответов
app.use(compression());

// Ограничение частоты запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов с одного IP за 15 минут
  message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use(limiter);

// Парсинг JSON и URL-encoded данных
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Конфигурация сессий для Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Инициализация Passport
app.use(passport.initialize());
app.use(passport.session());

// Статические файлы для миниатюр
app.use('/thumbnails', express.static('thumbnails'));

// Логирование запросов
app.use(logger.httpLogger.bind(logger));

// Логирование активности пользователей
app.use(logUserActivity);

// Импорт маршрутов
import termsRoutes from './routes/terms.js';
import worksRoutes from './routes/works.js';
import filesRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import collectionsRoutes from './routes/collections.js';

// Подключение маршрутов
app.use('/api/terms', termsRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Проверка соединения с базой данных
    await pool.query('SELECT 1');
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };
    
    logger.debug('Health check выполнен', healthData);
    res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Базовый маршрут
app.get('/api', (req, res) => {
  res.json({
    message: 'Музыкальная библиотека API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      terms: '/api/terms',
      works: '/api/works',
      files: '/api/files',
      auth: '/api/auth',
      collections: '/api/collections'
    }
  });
});

// Обработка 404 ошибок
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Эндпоинт не найден',
    path: req.originalUrl,
    method: req.method
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  logger.error('Необработанная ошибка сервера', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId || null
  });
  
  // Не раскрываем детали ошибок в продакшене
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Внутренняя ошибка сервера'
    : error.message;
  
  res.status(error.status || 500).json({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Запуск сервера
async function startServer() {
  try {
    // Проверка соединения с базой данных
    logger.info('🔗 Проверка соединения с базой данных...');
    await testDatabaseConnection();
    
    // Запуск HTTP сервера
    app.listen(PORT, () => {
      logger.info(`🚀 Сервер запущен на порту ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔧 API документация: http://localhost:${PORT}/api`);
      logger.info(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📝 Уровень логирования: ${process.env.LOG_LEVEL || 'info'}`);
    });
  } catch (error) {
    logger.error('❌ Ошибка запуска сервера', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Получен сигнал SIGTERM, завершение работы...');
  try {
    await pool.end();
    logger.info('✅ Пул соединений закрыт');
  } catch (error) {
    logger.error('Ошибка при закрытии пула соединений', { error: error.message });
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Получен сигнал SIGINT, завершение работы...');
  try {
    await pool.end();
    logger.info('✅ Пул соединений закрыт');
  } catch (error) {
    logger.error('Ошибка при закрытии пула соединений', { error: error.message });
  }
  process.exit(0);
});

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение Promise', { reason, promise });
  process.exit(1);
});

// Запуск приложения
startServer();