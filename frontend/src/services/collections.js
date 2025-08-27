import axios from 'axios';
import { authHeader } from './auth.js';

const API_BASE_URL = '/api/collections'; // Теперь запросы будут идти через Nginx

export const getCollections = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

export const createCollection = async (name) => {
  try {
    const response = await axios.post(API_BASE_URL, { name });
    return response.data;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const deleteCollection = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

export const getCollectionItems = async (collectionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${collectionId}/items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collection items:', error);
    throw error;
  }
};

export const addItemToCollection = async (collectionId, workId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${collectionId}/items`, { workId });
    return response.data;
  } catch (error) {
    console.error('Error adding item to collection:', error);
    throw error;
  }
};

export const removeCollectionItem = async (collectionId, itemId) => {
  try {
    await axios.delete(`${API_BASE_URL}/${collectionId}/items/${itemId}`);
  } catch (error) {
    console.error('Error removing item from collection:', error);
    throw error;
  }
}; 