import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'auth_token'

// Создание экземпляра axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем токен при ошибке авторизации
      removeToken()
      // Перенаправляем на страницу входа, если не находимся на ней
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Получить токен из localStorage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Сохранить токен в localStorage
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Удалить токен из localStorage
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Проверить, авторизован ли пользователь
 */
export function isAuthenticated() {
  return !!getToken()
}

/**
 * Получить заголовки авторизации
 */
export function authHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Регистрация нового пользователя
 */
export async function register(email, password, name) {
  const response = await api.post('/api/auth/register', {
    email,
    password,
    name
  })
  
  if (response.data.token) {
    setToken(response.data.token)
  }
  
  return response
}

/**
 * Вход в систему
 */
export async function login(email, password) {
  const response = await api.post('/api/auth/login', {
    email,
    password
  })
  
  if (response.data.token) {
    setToken(response.data.token)
  }
  
  return response
}

/**
 * Выход из системы
 */
export async function logout() {
  try {
    await api.post('/api/auth/logout')
  } catch (error) {
    console.error('Ошибка выхода из системы:', error)
  } finally {
    removeToken()
  }
}

/**
 * Получить информацию о текущем пользователе
 */
export async function getMe() {
  const response = await api.get('/api/auth/me')
  return response
}

/**
 * Обновить профиль пользователя
 */
export async function updateProfile(data) {
  const response = await api.put('/api/auth/profile', data)
  return response
}

/**
 * Проверить действительность токена
 */
export async function verifyToken() {
  try {
    const response = await api.post('/api/auth/verify-token')
    return response.data.valid
  } catch (error) {
    return false
  }
}