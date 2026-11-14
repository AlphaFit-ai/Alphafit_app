import Constants from 'expo-constants';

/**
 * Runtime configuration. The values are set in `app.config.ts` (`extra`) and read here, so the code
 * has one typed place to import them from. To point the app at another api set `EXPO_PUBLIC_API_URL`
 * (see `.env.example`); without it the production api is used.
 */

/** The production api. Keep in step with `DEFAULT_API_URL` in `app.config.ts`. */
export const DEFAULT_API_URL = 'https://api.alphafit-ai.com';

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface GoogleAuthIds {
  androidClientId: string;
  iosClientId: string;
  webClientId: string;
}

interface AppExtra {
  apiUrl?: string;
  firebase?: FirebaseWebConfig;
  googleAuth?: GoogleAuthIds;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const config = {
  // Backend API Configuration
  API_BASE_URL: extra.apiUrl || DEFAULT_API_URL,
  API_TIMEOUT: 30000,

  // Firebase web configuration and Google OAuth client ids (public identifiers, see app.config.ts)
  firebase: extra.firebase as FirebaseWebConfig,
  googleAuth: extra.googleAuth as GoogleAuthIds,
};
