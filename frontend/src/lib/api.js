import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.groupCollapsed('%c[API] Request', 'color:#E8192C;font-weight:bold');
    console.log('URL:', `${config.baseURL}${config.url}`);
    console.log('Method:', config.method?.toUpperCase());
    if (config.data) {
      const safeData = { ...config.data };
      if (safeData.password) safeData.password = '[REDACTED]';
      if (safeData.confirmPassword) safeData.confirmPassword = '[REDACTED]';
      console.log('Body:', safeData);
    }
    console.groupEnd();

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.groupCollapsed('%c[API] Response', 'color:#16a34a;font-weight:bold');
    console.log('Status:', response.status);
    console.log('URL:', response.config?.url);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.groupCollapsed('%c[API] Error', 'color:#dc2626;font-weight:bold');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status ?? 'NO_RESPONSE');
    console.error('Data:', error.response?.data ?? null);
    console.groupEnd();
    return Promise.reject(error);
  }
);
