import { executeQuery } from '../db.js';
import logger from '../utils/logger.js';

// Функция для валидации email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Функция для валидации пароля
export function isValidPassword(password) {
  return password && password.length >= 6;
}

// Функция для валидации пути файла (предотвращение directory traversal)
export function isValidFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // Проверяем на directory traversal попытки
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('../') || normalized.includes('..\\')) {
    return false;
  }
  
  // Проверяем на абсолютные пути
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return false;
  }
  
  return true;
}

// Функция для валидации ID
export function isValidId(id) {
  return id && Number.isInteger(Number(id)) && Number(id) > 0;
}

// Функция для валидации имени пользователя
export function isValidName(name) {
  return name && typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

// Функция для валидации названия коллекции
export function isValidCollectionName(name) {
  return name && typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 200;
}

// Функция для валидации термина
export function isValidTerm(term) {
  return term && typeof term === 'string' && term.trim().length >= 1 && term.trim().length <= 255;
}

// Функция для валидации определения термина
export function isValidDefinition(definition) {
  return definition && typeof definition === 'string' && definition.trim().length >= 10;
}

// Функция для очистки и нормализации строки
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.trim().replace(/\s+/g, ' ');
}

// Функция для ограничения длины строки
export function truncateString(str, maxLength = 100) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - 3) + '...';
}

// Функция для проверки существования пользователя
export async function userExists(userId) {
  try {
    const users = await executeQuery('SELECT id FROM users WHERE id = ? AND is_active = TRUE', [userId]);
    return users.length > 0;
  } catch (error) {
    logger.error('Ошибка проверки существования пользователя', { userId, error: error.message });
    return false;
  }
}

// Функция для проверки прав доступа к коллекции
export async function canAccessCollection(userId, collectionId) {
  try {
    const collections = await executeQuery(`
      SELECT id, user_id, is_public 
      FROM user_collections 
      WHERE id = ?
    `, [collectionId]);
    
    if (collections.length === 0) {
      return false;
    }
    
    const collection = collections[0];
    
    // Владелец может всегда получить доступ
    if (collection.user_id === userId) {
      return true;
    }
    
    // Публичные коллекции доступны всем авторизованным пользователям
    if (collection.is_public && userId) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Ошибка проверки доступа к коллекции', { 
      userId, 
      collectionId, 
      error: error.message 
    });
    return false;
  }
}

// Функция для валидации параметров пагинации
export function validatePagination(page, limit) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit
  };
}

// Функция для форматирования ответа с пагинацией
export function formatPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: total,
      items_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
}

// Функция для обработки ошибок базы данных
export function handleDatabaseError(error, operation) {
  logger.error(`Ошибка БД в операции: ${operation}`, { 
    error: error.message,
    code: error.code,
    errno: error.errno
  });
  
  // Определяем тип ошибки и возвращаем соответствующий HTTP статус
  if (error.code === 'ER_DUP_ENTRY') {
    return { status: 409, message: 'Запись уже существует' };
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return { status: 400, message: 'Ссылка на несуществующую запись' };
  }
  
  if (error.code === 'ECONNREFUSED') {
    return { status: 503, message: 'База данных недоступна' };
  }
  
  return { status: 500, message: 'Внутренняя ошибка сервера' };
}

// Функция для создания безопасного поискового запроса
export function buildSearchQuery(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '';
  }
  
  // Очищаем от специальных символов MySQL FULLTEXT
  const cleaned = searchTerm
    .replace(/[+\-><()~*\"@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length < 2) {
    return '';
  }
  
  // Добавляем * для поиска по началу слова
  return cleaned.split(' ')
    .filter(word => word.length >= 2)
    .map(word => `${word}*`)
    .join(' ');
}