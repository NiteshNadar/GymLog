import axios from 'axios';
import { env } from '../env.js';
import { tokenStore } from '../../auth/tokenStore.js';
import { refreshClient } from './refreshClient.js';

export const client = axios.create({
  baseURL: `${env.VITE_API_BASE_URL}/api/v1`,
  withCredentials: true, // Send HttpOnly refresh cookie
  timeout: 10000,
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh on 401 — prevents multiple simultaneous refresh calls
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (reason: unknown) => void }> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }
      
      isRefreshing = true;
      try {
        const { data } = await refreshClient.post('/auth/refresh');
        const token = data.data.accessToken;
        tokenStore.set(token);
        refreshQueue.forEach((p) => p.resolve(token));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch (refreshErr) {
        refreshQueue.forEach((p) => p.reject(refreshErr));
        refreshQueue = [];
        tokenStore.clear();
        // Fire custom event to notify AuthContext to log out
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
