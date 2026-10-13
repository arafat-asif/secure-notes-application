import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://secure-notes-application-cuk9.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('secure_notes_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
