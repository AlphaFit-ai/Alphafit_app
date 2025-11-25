import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config';

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
    const token = await AsyncStorage.getItem('authToken');
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
      console.error('Network error - please check your connection');
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.',
      });
    }

    // Handle specific HTTP status codes
    const status = error.response?.status;
    
    if (status === 401) {
      // Handle unauthorized access - clear auth token
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      console.log('Authentication expired, please login again');
    } else if (status === 404) {
      console.log('Resource not found:', error.config?.url);
    } else if (status === 500) {
      console.error('Server error:', error.response?.data?.message || 'Internal server error');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
