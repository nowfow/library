import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Создаем директорию для логов, если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Уровни логирования
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Цвета для консоли
const COLORS = {
  error: '\x1b[31m', // красный
  warn: '\x1b[33m',  // желтый
  info: '\x1b[36m',  // голубой
  debug: '\x1b[37m', // белый
  reset: '\x1b[0m'
};

class Logger {
  constructor() {
    this.currentLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  }

  writeToFile(level, formattedMessage) {
    const logFile = path.join(LOG_DIR, `${level}.log`);
    const allLogsFile = path.join(LOG_DIR, 'all.log');
    
    try {
      fs.appendFileSync(logFile, formattedMessage + '\n');
      fs.appendFileSync(allLogsFile, formattedMessage + '\n');
    } catch (err) {
      console.error('Ошибка записи в лог файл:', err.message);
    }
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] > this.currentLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Выводим в консоль с цветом
    if (process.env.NODE_ENV !== 'test') {
      const color = COLORS[level] || COLORS.reset;
      console.log(`${color}${formattedMessage}${COLORS.reset}`);
    }
    
    // Записываем в файл только в продакшене или если явно указано
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
      this.writeToFile(level, formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Middleware для логирования HTTP запросов
  httpLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      this.log(level, `HTTP ${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.userId || null
      });
    });
    
    next();
  }
}

export default new Logger();