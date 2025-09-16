import axios from 'axios'
import { authHeader } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Получить структуру файлов
 */
export async function getFileStructure(path = '/') {
  const response = await axios.get(`${API_URL}/api/files/structure`, {
    params: { path },
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить информацию о файле
 */
export async function getFileInfo(path) {
  const response = await axios.get(`${API_URL}/api/files/info`, {
    params: { path },
    headers: authHeader()
  })
  return response.data
}

/**
 * Поиск файлов
 */
export async function searchFiles(query, options = {}) {
  const response = await axios.get(`${API_URL}/api/files/search`, {
    params: {
      q: query,
      ...options
    },
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить статистику файлов
 */
export async function getFilesStats() {
  const response = await axios.get(`${API_URL}/api/files/stats`, {
    headers: authHeader()
  })
  return response.data
}

/**
 * Получить URL для скачивания файла
 */
export function getDownloadUrl(path) {
  return `${API_URL}/api/files/download?path=${encodeURIComponent(path)}`
}

/**
 * Скачать файл
 */
export async function downloadFile(path, filename) {
  const response = await axios.get(`${API_URL}/api/files/download`, {
    params: { path },
    responseType: 'blob',
    headers: authHeader()
  })
  
  // Создаем ссылку для скачивания
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename || path.split('/').pop())
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  return response
}

/**
 * Получить прямую ссылку на PDF файл для просмотра
 */
export function getPdfViewUrl(path) {
  return `${API_URL}/api/files/download?path=${encodeURIComponent(path)}`
}