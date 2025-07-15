import axios from 'axios';
import { authHeader } from './auth.js';

const apiUrl = import.meta.env.VITE_API_URL || '';

export async function getCollections() {
  return axios.get(`${apiUrl}/api/collections`, { headers: authHeader() });
}

export async function createCollection(name) {
  return axios.post(`${apiUrl}/api/collections`, { name }, { headers: authHeader() });
}

export async function deleteCollection(id) {
  return axios.delete(`${apiUrl}/api/collections/${id}`, { headers: authHeader() });
}

export async function getCollectionItems(collectionId) {
  return axios.get(`${apiUrl}/api/collections/${collectionId}/items`, { headers: authHeader() });
}

export async function addItemToCollection(collectionId, workId) {
  return axios.post(`${apiUrl}/api/collections/${collectionId}/items`, { work_id: workId }, { headers: authHeader() });
}

export async function removeItemFromCollection(collectionId, itemId) {
  return axios.delete(`${apiUrl}/api/collections/${collectionId}/items/${itemId}`, { headers: authHeader() });
} 