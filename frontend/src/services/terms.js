import axios from 'axios'
import { authHeader } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Получить все термины с возможностью поиска
 */
export async function getTerms(params = {}) {
  const response = await axios.get(`${API_URL}/api/terms`, {
    params,
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить термин по ID
 */
export async function getTerm(id) {
  const response = await axios.get(`${API_URL}/api/terms/${id}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Поиск терминов
 */
export async function searchTerms(query, exact = false) {
  const response = await axios.get(`${API_URL}/api/terms/search`, {
    params: {
      q: query,
      exact
    },
    headers: authHeader()
  })
  return response.data
}

/**
 * Умный поиск терминов с исправлением опечаток
 */
export async function smartSearchTerms(query, params = {}) {
  const response = await axios.get(`${API_URL}/api/terms/smart-search`, {
    params: {
      q: query,
      ...params
    },
    headers: authHeader()
  })
  return response.data
}

/**
 * Создать новый термин (только для администраторов)
 */
export async function createTerm(term, definition) {
  const response = await axios.post(`${API_URL}/api/terms`, {
    term,
    definition
  }, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Обновить термин (только для администраторов)
 */
export async function updateTerm(id, data) {
  const response = await axios.put(`${API_URL}/api/terms/${id}`, data, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Удалить термин (только для администраторов)
 */
export async function deleteTerm(id) {
  const response = await axios.delete(`${API_URL}/api/terms/${id}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить статистику терминов
 */
export async function getTermsStats() {
  const response = await axios.get(`${API_URL}/api/terms/stats/summary`, {
    headers: authHeader()
  })
  return response.data
}