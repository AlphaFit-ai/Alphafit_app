import axios from 'axios';
import { config } from '../config';
import { storage } from './storage';

const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      // Network error - don't log, it's expected when offline
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.',
      });
    }

    // Handle specific HTTP status codes
    const status = error.response?.status;

    if (status === 401) {
      // Handle unauthorized access - clear auth token silently
      await storage.removeItem('authToken');
      await storage.removeItem('userId');
    } else if (status === 404) {
      // Resource not found - expected for some optional endpoints
    } else if (status === 500) {
      // Only log server errors if they're unexpected
      const errorMessage = error.response?.data?.message || 'Internal server error';
      if (!errorMessage.includes('already exists')) {
        console.error('Server error:', errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
