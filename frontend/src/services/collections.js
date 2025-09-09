import axios from 'axios'
import { authHeader } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Получить все коллекции пользователя
 */
export async function getCollections() {
  const response = await axios.get(`${API_URL}/api/collections`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить публичные коллекции
 */
export async function getPublicCollections(params = {}) {
  const response = await axios.get(`${API_URL}/api/collections/public`, {
    params,
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить конкретную коллекцию
 */
export async function getCollection(id) {
  const response = await axios.get(`${API_URL}/api/collections/${id}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Создать новую коллекцию
 */
export async function createCollection(name, description = '', isPublic = false) {
  const response = await axios.post(`${API_URL}/api/collections`, {
    name,
    description,
    is_public: isPublic
  }, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Обновить коллекцию
 */
export async function updateCollection(id, data) {
  const response = await axios.put(`${API_URL}/api/collections/${id}`, data, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Удалить коллекцию
 */
export async function deleteCollection(id) {
  const response = await axios.delete(`${API_URL}/api/collections/${id}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Добавить произведение в коллекцию
 */
export async function addWorkToCollection(collectionId, workId) {
  const response = await axios.post(`${API_URL}/api/collections/${collectionId}/works`, {
    work_id: workId
  }, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Удалить произведение из коллекции
 */
export async function removeWorkFromCollection(collectionId, workId) {
  const response = await axios.delete(`${API_URL}/api/collections/${collectionId}/works/${workId}`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить произведения в коллекции
 */
export async function getCollectionWorks(collectionId, params = {}) {
  const response = await axios.get(`${API_URL}/api/collections/${collectionId}/works`, {
    params,
    headers: authHeader()
  })
  return response.data
}