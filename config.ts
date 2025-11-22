// Application configuration
export const config = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
  API_TIMEOUT: 30000,
  
  // Firebase Configuration
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyDKvcnOJ9jkPltB-OSJj-3WINgzgeHz2WU",
    authDomain: "alphafit-ai-app.firebaseapp.com",
    projectId: "alphafit-ai-app",
    storageBucket: "alphafit-ai-app.firebasestorage.app",
    messagingSenderId: "972624920920",
    appId: "1:972624920920:web:460ed965df17f6bb23652d",
    measurementId: "G-QT7EH1NMS5"
  },
  
  // App Configuration
  APP_NAME: 'AlphaFit AI',
  APP_VERSION: '1.0.0',
};
