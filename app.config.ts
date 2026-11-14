import type { ConfigContext, ExpoConfig } from 'expo/config';
import { AndroidConfig, withAndroidManifest } from 'expo/config-plugins';

/**
 * Expo configuration. It replaces `app.json` so values can come from the environment.
 *
 * `EXPO_PUBLIC_API_URL` is the address of the api (no trailing slash needed). It is read when the app
 * is built or started; when it is not set the production api is used, so the existing EAS profiles keep
 * working unchanged. Point a development or preview profile at its own host in `eas.json` (`env`) or
 * in a local `.env` file (see `.env.example`).
 */
const DEFAULT_API_URL = 'https://api.alphafit-ai.com';

function resolveApiUrl(value: string | undefined): string {
  const url = (value ?? '').trim().replace(/\/+$/, '');
  if (!url) return DEFAULT_API_URL;
  if (!/^https?:\/\/[^\s/]+/i.test(url)) {
    throw new Error(`EXPO_PUBLIC_API_URL must start with http:// or https:// (got "${value}")`);
  }
  return url;
}

/**
 * Plain http is for development builds only (a phone reaching the api on a computer, see README "Testing
 * on a phone"). `profile` is the EAS build profile (EAS sets `EAS_BUILD_PROFILE`); a local start or export
 * has none and is not checked. A preview or production build with an http address, or with the
 * placeholder host still in `eas.json`, stops here instead of shipping an app that cannot reach the api.
 */
export function checkApiUrlForProfile(url: string, profile: string | undefined): void {
  if (!profile) return;
  if (/REPLACE-WITH/i.test(url)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL of the "${profile}" profile is still a placeholder (${url}): set the real host in eas.json`
    );
  }
  if (profile !== 'development' && url.startsWith('http://')) {
    throw new Error(
      `The "${profile}" profile must use https (EXPO_PUBLIC_API_URL=${url}); plain http is for development builds only`
    );
  }
}

/**
 * Android: cleartext (http) traffic is allowed in development builds only. Release builds (the preview
 * and production profiles) say so explicitly in the main manifest; debug builds also get it from the
 * debug manifest that Metro needs.
 */
export function setCleartextTraffic(
  manifest: AndroidConfig.Manifest.AndroidManifest,
  profile: string | undefined
): AndroidConfig.Manifest.AndroidManifest {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  app.$['android:usesCleartextTraffic'] = profile === 'development' ? 'true' : 'false';
  return manifest;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE || undefined;
  const apiUrl = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL);
  checkApiUrlForProfile(apiUrl, profile);
  const expoConfig: ExpoConfig = {
    ...config,
    name: 'AlphaFit AI',
    slug: 'alphafit-ai',
    version: '1.0.0',
    owner: 'alpha_fit',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'alphafitai',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.app.alphafit',
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      package: 'com.app.alphafit',
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        // Brand kit layers (concept Summit); the symbol sits inside the 66 dp safe zone of the 108 dp canvas.
        backgroundColor: '#111827',
        foregroundImage: './assets/images/brand/adaptive-foreground.png',
        backgroundImage: './assets/images/brand/adaptive-background.png',
        monochromeImage: './assets/images/brand/adaptive-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
      // Added by `expo install` (SDK 55+): these packages ship config plugins, used here with their defaults.
      'expo-font',
      'expo-image',
      'expo-localization',
      'expo-secure-store',
      'expo-status-bar',
      [
        'expo-splash-screen',
        {
          // The brand symbol: the light-background version on white, the dark one on navy.
          image: './assets/images/brand/splash-light.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            image: './assets/images/brand/splash-dark.png',
            backgroundColor: '#111827',
          },
        },
      ],
      // Sign in with Apple exists on iOS only (the Apple button is not shown on Android).
      'expo-apple-authentication',
      // Reads the Firebase files above to set up Google sign-in on both platforms.
      '@react-native-google-signin/google-signin',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'd4d7ef19-1d48-44d1-bdeb-ff217fb0f617',
      },
      apiUrl,
      // Public client identifiers (they ship inside every build and are not secrets): the Firebase web
      // app configuration and the Google OAuth client ids.
      firebase: {
        apiKey: 'AIzaSyDKvcnOJ9jkPltB-OSJj-3WINgzgeHz2WU',
        authDomain: 'alphafit-ai-app.firebaseapp.com',
        projectId: 'alphafit-ai-app',
        storageBucket: 'alphafit-ai-app.firebasestorage.app',
        messagingSenderId: '972624920920',
        appId: '1:972624920920:web:460ed965df17f6bb23652d',
        measurementId: 'G-QT7EH1NMS5',
      },
      googleAuth: {
        androidClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
        iosClientId: '972624920920-s0r51ubufl4271hublj74bni1rdmei90.apps.googleusercontent.com',
        webClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
      },
    },
  };
  return withAndroidManifest(expoConfig, (mod) => {
    mod.modResults = setCleartextTraffic(mod.modResults, profile);
    return mod;
  });
};
