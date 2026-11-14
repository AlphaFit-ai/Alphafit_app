/**
 * Test setup. Native modules and the Firebase SDK are replaced with plain mocks so the app's own
 * code (services, contexts, the sign-in and sign-out logic) runs for real in Node.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest')
);

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

// What app.config.ts puts in `extra`, with a test api address.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'https://api.test.invalid',
        firebase: { apiKey: 'test', projectId: 'test' },
        googleAuth: { webClientId: 'test.apps.googleusercontent.com' },
      },
    },
  },
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

// `mockAuth` is the one Firebase auth instance; tests reach it with `require('firebase/auth')`.
jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    authStateReady: jest.fn(() => Promise.resolve()),
  };
  return {
    __mockAuth: mockAuth,
    getAuth: jest.fn(() => mockAuth),
    initializeAuth: jest.fn(() => mockAuth),
    getReactNativePersistence: jest.fn(),
    GoogleAuthProvider: { credential: jest.fn() },
    OAuthProvider: jest.fn(),
    signInWithCredential: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    signOut: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    hasPreviousSignIn: jest.fn(() => true),
    signIn: jest.fn(),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

// The tests run as a development build: not Expo Go (jest-expo's mocks would report Expo Go, because
// they provide an `ExpoGo` native module), and with the Google sign-in native module present
// (services/nativeModules.ts asks for it before loading the package). __tests__/expoGo.test.tsx and
// nativeModules.test.ts set up Expo Go and a binary without the module themselves.
jest.mock('expo', () => ({
  __esModule: true,
  ...jest.requireActual('expo'),
  isRunningInExpoGo: jest.fn(() => false),
}));
{
  const { TurboModuleRegistry } = require('react-native');
  const realGet = TurboModuleRegistry.get;
  jest
    .spyOn(TurboModuleRegistry, 'get')
    .mockImplementation((name) => (name === 'RNGoogleSignin' ? {} : realGet(name)));
}

// Skia (the theme switch's circular reveal) has no native canvas in Jest: plain views stand in, and the
// snapshot resolves to a disposable image. src/ui/ThemeTransition's own tests pass their own snapshot.
jest.mock('@shopify/react-native-skia', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const box = (props) =>
    createElement(View, { testID: props.testID, style: props.style }, props.children);
  return {
    Canvas: box,
    Group: box,
    Circle: () => null,
    Image: () => null,
    makeImageFromView: jest.fn(async () => ({ dispose: jest.fn() })),
  };
});

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

beforeEach(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await AsyncStorage.clear();
});

// The first render of a screen in a fresh worker loads many modules; give async queries room.
require('@testing-library/react-native').configure({ asyncUtilTimeout: 5000 });

// expo-secure-store: an in-memory store (cleared before every test).
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __store: store,
    getItemAsync: jest.fn(async (k) => (store.has(k) ? store.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void store.delete(k)),
  };
});
beforeEach(() => {
  require('expo-secure-store').__store.clear();
  require('./services/tokenStore').tokenStore._resetMigration();
});

// NetInfo has no native module in Jest.
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => undefined),
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

// Server data and the session start empty in every test; failed queries do not retry (it only slows tests).
beforeEach(() => {
  const { queryClient } = require('./services/queryClient');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 30000, gcTime: Infinity } });
  require('./services/sessionStore').sessionStore.reset();
});
