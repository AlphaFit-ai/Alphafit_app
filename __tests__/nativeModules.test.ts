/**
 * Google sign-in is loaded on demand (services/nativeModules.ts): configured once in a development or
 * release build, never required in Expo Go or in a binary without its native module, and a missing
 * module is an expected state, not an error. Expo Go is recognised the way Expo does it (the `ExpoGo`
 * native module, `isRunningInExpoGo()`): Expo Go 58 does not report `executionEnvironment`
 * "storeClient", and the old check let the package load there and log a red error on the phone.
 */
type Native = typeof import('../services/nativeModules');

interface Setting {
  expoGo: boolean;
  executionEnvironment: string | undefined;
  googleNative: boolean;
  googleModule: () => unknown;
}

function load({ expoGo, executionEnvironment, googleNative, googleModule }: Setting) {
  const required = jest.fn(googleModule);
  jest.resetModules();
  jest.doMock('expo', () => ({ __esModule: true, isRunningInExpoGo: () => expoGo }));
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      executionEnvironment,
      expoConfig: { extra: { googleAuth: { webClientId: 'web-id.apps.googleusercontent.com' } } },
    },
  }));
  jest.doMock('@react-native-google-signin/google-signin', () => required());
  // A fresh copy after resetModules, with the mocks above.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TurboModuleRegistry } = require('react-native');
  jest
    .spyOn(TurboModuleRegistry, 'get')
    .mockImplementation((name) => (name === 'RNGoogleSignin' && googleNative ? {} : null));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const native: Native = require('../services/nativeModules');
  return { native, required };
}

const fakeGoogle = () => ({ GoogleSignin: { configure: jest.fn(), signOut: jest.fn() } });
const missing = () => {
  throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found.");
};

let consoleError: jest.SpyInstance;
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  consoleError.mockRestore();
});

it('in a development or release build: loads and configures Google sign-in once, as before', () => {
  const module = fakeGoogle();
  const { native, required } = load({
    expoGo: false,
    executionEnvironment: 'bare',
    googleNative: true,
    googleModule: () => module,
  });
  expect(native.isExpoGo()).toBe(false);
  const google = native.getGoogleSignin();
  expect(google).toBe(module.GoogleSignin);
  expect(native.getGoogleSignin()).toBe(google);
  expect(required).toHaveBeenCalledTimes(1);
  expect(module.GoogleSignin.configure).toHaveBeenCalledTimes(1);
  expect(module.GoogleSignin.configure).toHaveBeenCalledWith(
    expect.objectContaining({
      webClientId: 'web-id.apps.googleusercontent.com',
      offlineAccess: true,
    })
  );
  expect(consoleError).not.toHaveBeenCalled();
});

it('in Expo Go 58, whose executionEnvironment is not "storeClient": no require, no error logged', () => {
  for (const executionEnvironment of ['bare', 'standalone', undefined]) {
    const { native, required } = load({
      expoGo: true,
      executionEnvironment,
      // Even if the registry said yes, Expo Go never loads the package.
      googleNative: true,
      googleModule: missing,
    });
    expect(native.isExpoGo()).toBe(true);
    expect(native.getGoogleSignin()).toBeNull();
    expect(required).not.toHaveBeenCalled();
  }
  expect(consoleError).not.toHaveBeenCalled();
});

it('in a build without the Google native module: null, the package is not required, nothing logged', () => {
  const { native, required } = load({
    expoGo: false,
    executionEnvironment: 'bare',
    googleNative: false,
    googleModule: missing,
  });
  expect(native.getGoogleSignin()).toBeNull();
  expect(required).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

it('a module that is there but fails to load is a real error, and is logged', () => {
  const { native } = load({
    expoGo: false,
    executionEnvironment: 'bare',
    googleNative: true,
    googleModule: () => ({
      GoogleSignin: {
        configure: () => {
          throw new Error('bad client id');
        },
      },
    }),
  });
  expect(native.getGoogleSignin()).toBeNull();
  expect(consoleError).toHaveBeenCalledTimes(1);
  expect(String(consoleError.mock.calls[0][0])).toMatch(/nativeModules\.googleSignin/);
});
