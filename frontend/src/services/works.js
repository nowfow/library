import axios from 'axios'
import { authHeader } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Получить все произведения с фильтрацией
 */
export async function getWorks(params = {}) {
  const response = await axios.get(`${API_URL}/api/works`, {
    params,
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить произведение по ID
 */
export async function getWork(id) {
  const response = await axios.get(`${API_URL}/api/works/${id}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Поиск произведений
 */
export async function searchWorks(query, params = {}) {
  const response = await axios.get(`${API_URL}/api/works/search`, {
    params: {
      q: query,
      ...params
    },
    headers: authHeader()
  })
  return response.data
}

/**
 * Расширенный поиск произведений
 */
export async function searchWorksAdvanced(params = {}) {
  const response = await axios.get(`${API_URL}/api/works/search/advanced`, {
    params,
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить произведения конкретного композитора
 */
export async function getWorksByComposer(composer, params = {}) {
  const response = await axios.get(`${API_URL}/api/works/composer/${encodeURIComponent(composer)}`, {
    params,
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить категории произведений
 */
export async function getCategories() {
  const response = await axios.get(`${API_URL}/api/works/categories`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить композиторов
 */
export async function getComposers() {
  const response = await axios.get(`${API_URL}/api/works/composers`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить статистику произведений
 */
export async function getWorksStats() {
  const response = await axios.get(`${API_URL}/api/works/stats/summary`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить предложения для поиска
 */
export async function getSearchSuggestions(query) {
  const response = await axios.get(`${API_URL}/api/works/search/suggestions`, {
    params: { q: query },
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить миниатюру произведения
 */
export function getThumbnailUrl(workId) {
  return `${API_URL}/api/works/${workId}/thumbnail`
}