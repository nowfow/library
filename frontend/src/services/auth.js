import axios from 'axios';

const TOKEN_KEY = 'auth_token';

export async function register(email, password) {
  try {
    const response = await axios.post('/api/auth/register', { email, password });
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
} 