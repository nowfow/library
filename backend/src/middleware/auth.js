import jwt from 'jsonwebtoken';
import { executeQuery } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';

// Middleware для проверки JWT токена
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Ошибка верификации токена:', err.message);
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    
    req.user = user;
    next();
  });
}

// Middleware для проверки роли администратора
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  
  next();
}

// Middleware для проверки активности пользователя
export async function checkUserActive(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const users = await executeQuery(
      'SELECT is_active FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0 || !users[0].is_active) {
      return res.status(403).json({ error: 'Аккаунт пользователя деактивирован' });
    }
    
    next();
  } catch (error) {
    console.error('Ошибка проверки активности пользователя:', error);
    res.status(500).json({ error: 'Ошибка проверки пользователя' });
  }
}

// Middleware для логирования запросов пользователей
export function logUserActivity(req, res, next) {
  if (req.user) {
    console.log(`👤 Пользователь ${req.user.email} (ID: ${req.user.userId}) - ${req.method} ${req.path}`);
  }
  next();
}

// Опциональная авторизация (не требует токен, но проверяет если есть)
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}