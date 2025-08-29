import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

/**
 * Search for musical works
 * @param {Object} params - Search parameters
 * @param {string} params.composer - Composer name
 * @param {string} params.work - Work title
 * @returns {Promise<Array>} Search results
 */
export async function searchWorks({ composer, work }) {
  try {
    const params = {};
    if (composer) params.composer = composer;
    if (work) params.work = work;
    
    const response = await apiClient.get('/api/works', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching works:', error);
    throw new Error('Ошибка поиска произведений');
  }
}

/**
 * Get files for a specific work
 * @param {string} composer - Composer name
 * @param {string} work - Work title
 * @returns {Promise<Array>} File list
 */
export async function getWorkFiles(composer, work) {
  try {
    const response = await apiClient.get('/api/works/files', {
      params: { composer, work }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting work files:', error);
    throw new Error('Ошибка получения файлов произведения');
  }
}

/**
 * Search musical terms
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export async function searchTerms(query) {
  try {
    const response = await apiClient.get('/api/terms/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching terms:', error);
    throw new Error('Ошибка поиска терминов');
  }
}

/**
 * Get all terms
 * @returns {Promise<Array>} All terms
 */
export async function getAllTerms() {
  try {
    const response = await apiClient.get('/api/terms');
    return response.data;
  } catch (error) {
    console.error('Error getting all terms:', error);
    throw new Error('Ошибка получения терминов');
  }
}

/**
 * List files in WebDAV directory
 * @param {string} path - Directory path
 * @returns {Promise<Array>} File/directory list
 */
export async function listCloudFiles(path = '/') {
  try {
    const response = await apiClient.get('/api/files/cloud/list', {
      params: { path }
    });
    return response.data;
  } catch (error) {
    console.error('Error listing cloud files:', error);
    throw new Error('Ошибка получения списка файлов');
  }
}

/**
 * Get download URL for a file
 * @param {string} filePath - File path
 * @returns {string} Download URL
 */
export function getFileDownloadUrl(filePath) {
  const encodedPath = encodeURIComponent(filePath);
  return `${API_BASE_URL}/api/files/pdf?pdf_path=${encodedPath}`;
}

/**
 * Get thumbnail URL for a PDF
 * @param {string} pdfPath - PDF file path
 * @returns {string} Thumbnail URL
 */
export function getThumbnailUrl(pdfPath) {
  const encodedPath = encodeURIComponent(pdfPath);
  return `${API_BASE_URL}/api/files/thumbnail?pdf_path=${encodedPath}`;
}

/**
 * Get work thumbnail URL
 * @param {string} pdfPath - PDF file path
 * @returns {string} Thumbnail URL
 */
export function getWorkThumbnailUrl(pdfPath) {
  const encodedPath = encodeURIComponent(pdfPath);
  return `${API_BASE_URL}/api/works/thumbnail?pdf_path=${encodedPath}`;
}