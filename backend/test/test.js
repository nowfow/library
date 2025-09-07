#!/usr/bin/env node

/**
 * Простые тесты для проверки функциональности API
 * Запуск: node test/test.js
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let userId = null;

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    return {
      status: response.status,
      data: parsedData,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      ok: false
    };
  }
}

async function test(name, testFn) {
  try {
    log(`🧪 Тест: ${name}`, 'blue');
    await testFn();
    log(`✅ Успешно: ${name}`, 'green');
  } catch (error) {
    log(`❌ Неудача: ${name} - ${error.message}`, 'red');
  }
}

async function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  log('🚀 Запуск тестов API музыкальной библиотеки', 'yellow');
  log('='.repeat(50), 'yellow');

  // Тест 1: Health Check
  await test('Health Check', async () => {
    const response = await makeRequest('/health');
    await expect(response.ok, `Health check неудачен: ${response.status}`);
    await expect(response.data.status === 'healthy', 'Статус не healthy');
  });

  // Тест 2: API Info
  await test('API Info', async () => {
    const response = await makeRequest('/api');
    await expect(response.ok, `API info неудачен: ${response.status}`);
    await expect(response.data.message.includes('Музыкальная библиотека'), 'Неверное сообщение API');
  });

  // Тест 3: Регистрация пользователя
  await test('Регистрация пользователя', async () => {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Тестовый Пользователь'
    };

    const response = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    await expect(response.ok, `Регистрация неудачна: ${JSON.stringify(response.data)}`);
    await expect(response.data.data.token, 'Токен не получен');
    
    authToken = response.data.data.token;
    userId = response.data.data.user.id;
  });

  // Тест 4: Авторизация
  await test('Авторизация', async () => {
    const response = await makeRequest('/api/auth/me');
    await expect(response.ok, `Авторизация неудачна: ${response.status}`);
    await expect(response.data.data.email, 'Email пользователя не получен');
  });

  // Тест 5: Получение произведений
  await test('Получение произведений', async () => {
    const response = await makeRequest('/api/works');
    await expect(response.ok, `Получение произведений неудачно: ${response.status}`);
    await expect(Array.isArray(response.data.data), 'Данные произведений не являются массивом');
  });

  // Тест 6: Поиск произведений
  await test('Поиск произведений', async () => {
    const response = await makeRequest('/api/works/search?q=концерт');
    await expect(response.ok, `Поиск произведений неудачен: ${response.status}`);
    await expect(Array.isArray(response.data.data), 'Результаты поиска не являются массивом');
  });

  // Тест 7: Получение терминов
  await test('Получение терминов', async () => {
    const response = await makeRequest('/api/terms');
    await expect(response.ok, `Получение терминов неудачно: ${response.status}`);
    await expect(Array.isArray(response.data.data), 'Данные терминов не являются массивом');
  });

  // Тест 8: Создание коллекции
  await test('Создание коллекции', async () => {
    const collectionData = {
      name: 'Моя тестовая коллекция',
      description: 'Описание тестовой коллекции',
      is_public: false
    };

    const response = await makeRequest('/api/collections', {
      method: 'POST',
      body: JSON.stringify(collectionData)
    });

    await expect(response.ok, `Создание коллекции неудачно: ${JSON.stringify(response.data)}`);
    await expect(response.data.data.name === collectionData.name, 'Неверное название коллекции');
  });

  // Тест 9: Получение файловой структуры
  await test('Получение файловой структуры', async () => {
    const response = await makeRequest('/api/files/browse');
    await expect(response.ok, `Получение файловой структуры неудачно: ${response.status}`);
    await expect(Array.isArray(response.data.data), 'Данные файловой структуры не являются массивом');
  });

  // Тест 10: Неавторизованный доступ
  await test('Неавторизованный доступ к защищенному эндпоинту', async () => {
    const tempToken = authToken;
    authToken = null; // Убираем токен
    
    const response = await makeRequest('/api/collections', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' })
    });
    
    await expect(!response.ok, 'Неавторизованный запрос должен быть отклонен');
    await expect(response.status === 401, `Ожидался статус 401, получен ${response.status}`);
    
    authToken = tempToken; // Восстанавливаем токен
  });

  log('='.repeat(50), 'yellow');
  log('🎉 Все тесты завершены!', 'green');
}

// Проверка доступности сервера
async function checkServerAvailability() {
  try {
    const response = await makeRequest('/health');
    if (!response.ok) {
      throw new Error(`Сервер недоступен (статус: ${response.status})`);
    }
    return true;
  } catch (error) {
    log(`❌ Сервер недоступен на ${BASE_URL}`, 'red');
    log('Убедитесь, что сервер запущен: npm run dev', 'yellow');
    process.exit(1);
  }
}

// Запуск тестов
(async () => {
  await checkServerAvailability();
  await runTests();
})().catch(error => {
  log(`💥 Критическая ошибка: ${error.message}`, 'red');
  process.exit(1);
});