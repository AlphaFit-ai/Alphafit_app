import type { ConfigContext } from 'expo/config';
import appConfig from '../app.config';
import { config, DEFAULT_API_URL } from '../config';

const PRODUCTION_API = 'https://api.alphafit-ai.com';

function resolve(env: string | undefined) {
  const before = process.env.EXPO_PUBLIC_API_URL;
  if (env === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = env;
  try {
    return appConfig({ config: {} } as ConfigContext);
  } finally {
    if (before === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = before;
  }
}

describe('app.config.ts', () => {
  it('uses the production api when EXPO_PUBLIC_API_URL is not set, so existing EAS profiles keep working', () => {
    expect(resolve(undefined).extra?.apiUrl).toBe(PRODUCTION_API);
    expect(resolve('').extra?.apiUrl).toBe(PRODUCTION_API);
    expect(resolve('   ').extra?.apiUrl).toBe(PRODUCTION_API);
  });

  it('uses EXPO_PUBLIC_API_URL when it is set, without a trailing slash', () => {
    expect(resolve('http://10.0.2.2:8180').extra?.apiUrl).toBe('http://10.0.2.2:8180');
    expect(resolve('https://staging.example.com///').extra?.apiUrl).toBe(
      'https://staging.example.com'
    );
  });

  it('refuses a value that is not an http(s) address instead of building an app that cannot reach the api', () => {
    expect(() => resolve('api.example.com')).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => resolve('ftp://example.com')).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('keeps the identity of the app and the plugins the native build needs', () => {
    const result = resolve(undefined);
    expect(result).toMatchObject({
      name: 'AlphaFit AI',
      slug: 'alphafit-ai',
      ios: { bundleIdentifier: 'com.app.alphafit' },
      android: { package: 'com.app.alphafit' },
    });
    expect(result.plugins).toEqual(
      expect.arrayContaining([
        'expo-router',
        'expo-apple-authentication',
        '@react-native-google-signin/google-signin',
      ])
    );
  });
});

describe('config.ts', () => {
  it('has the same production default as app.config.ts', () => {
    expect(DEFAULT_API_URL).toBe(PRODUCTION_API);
  });

  it('reads the api address from the Expo config (the test setup supplies one)', () => {
    expect(config.API_BASE_URL).toBe('https://api.test.invalid');
    expect(config.API_TIMEOUT).toBe(30000);
  });
});
