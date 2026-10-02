import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('paya_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log errors for debugging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log('API error:', err.response?.status, err.response?.data || err.message);
    return Promise.reject(err);
  }
);