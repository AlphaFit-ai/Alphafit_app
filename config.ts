// API Configuration
// Update these values for your environment

export const config = {
  // Backend API URL - Update this with your Spring Boot backend URL
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
  
  // API Timeout
  API_TIMEOUT: 30000,
  
  // OAuth Configuration (if needed)
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '',
  
  // Feature Flags
  ENABLE_GOOGLE_AUTH: true,
  ENABLE_APPLE_AUTH: true,
  ENABLE_EMAIL_AUTH: true,
  
  // App Configuration
  APP_NAME: 'Forge AI',
  APP_VERSION: '1.0.0',
};
