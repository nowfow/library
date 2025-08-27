import axios from 'axios';
import { authHeader } from './auth.js';

export async function getCollections() {
  return axios.get('/api/collections', { headers: authHeader() });
}

export async function createCollection(name) {
  return axios.post('/api/collections', { name }, { headers: authHeader() });
}

export async function deleteCollection(id) {
  return axios.delete(`/api/collections/${id}`, { headers: authHeader() });
}

export async function getCollectionItems(collectionId) {
  return axios.get(`/api/collections/${collectionId}/items`, { headers: authHeader() });
}

export async function addItemToCollection(collectionId, workId) {
  return axios.post(`/api/collections/${collectionId}/items`, { work_id: workId }, { headers: authHeader() });
}

export async function removeItemFromCollection(collectionId, itemId) {
  return axios.delete(`/api/collections/${collectionId}/items/${itemId}`, { headers: authHeader() });
} 