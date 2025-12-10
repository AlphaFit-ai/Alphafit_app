// Configuration for AlphaFit AI App
export const config = {
  // Backend API Configuration
  // Physical device: Using detected device IP
  // If backend is unreachable, replace with your computer's local IP (run ipconfig)
  API_BASE_URL: 'http://62.171.131.141:30081/api',
  API_TIMEOUT: 30000,

  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyDKvcnOJ9jkPltB-OSJj-3WINgzgeHz2WU",
    authDomain: "alphafit-ai-app.firebaseapp.com",
    projectId: "alphafit-ai-app",
    storageBucket: "alphafit-ai-app.firebasestorage.app",
    messagingSenderId: "972624920920",
    appId: "1:972624920920:web:460ed965df17f6bb23652d",
    measurementId: "G-QT7EH1NMS5"
  },

  // Google OAuth Client IDs
  googleAuth: {
    androidClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
    iosClientId: '972624920920-s0r51ubufl4271hublj74bni1rdmei90.apps.googleusercontent.com',
    webClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
  },

  // App Configuration
  app: {
    name: 'AlphaFit AI',
    version: '1.0.0',
  }
};
