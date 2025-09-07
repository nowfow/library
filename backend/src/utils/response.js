// Утилиты для стандартизации API ответов

export function success(res, data = null, message = 'Успешно', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

export function error(res, message = 'Ошибка сервера', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
}

export function validationError(res, errors = []) {
  return res.status(400).json({
    success: false,
    error: 'Ошибка валидации',
    validation_errors: errors,
    timestamp: new Date().toISOString()
  });
}

export function unauthorized(res, message = 'Не авторизован') {
  return res.status(401).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function forbidden(res, message = 'Доступ запрещен') {
  return res.status(403).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function notFound(res, message = 'Ресурс не найден') {
  return res.status(404).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function conflict(res, message = 'Конфликт данных') {
  return res.status(409).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function created(res, data = null, message = 'Создано успешно') {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}