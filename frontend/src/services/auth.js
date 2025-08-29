import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'auth_token';

export async function register(email, password) {
  return axios.post(`${apiUrl}/api/auth/register`, { email, password });
}

export async function login(email, password) {
  const res = await axios.post(`${apiUrl}/api/auth/login`, { email, password });
  if (res.data.token) {
    localStorage.setItem(TOKEN_KEY, res.data.token);
  }
  return res;
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