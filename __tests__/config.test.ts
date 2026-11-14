import type { ConfigContext } from 'expo/config';
import appConfig, { checkApiUrlForProfile, setCleartextTraffic } from '../app.config';
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

/**
 * Build profiles (eas.json): plain http only in development, a real https host for the others, and a
 * placeholder host stops the build rather than shipping an app that cannot reach the api.
 */
describe('build profiles', () => {
  const eas = require('../eas.json');
  const profiles = eas.build as Record<
    string,
    { env?: Record<string, string>; channel?: string; autoIncrement?: boolean }
  >;

  it('has development, preview and production, each with its api address and channel', () => {
    expect(Object.keys(profiles).sort()).toEqual(['development', 'preview', 'production']);
    for (const [name, profile] of Object.entries(profiles)) {
      expect(profile.env?.EXPO_PUBLIC_API_URL).toMatch(/^https?:\/\//);
      expect(profile.channel).toBe(name);
    }
  });

  it('uses plain http in development only', () => {
    const http = Object.entries(profiles)
      .filter(([, p]) => p.env!.EXPO_PUBLIC_API_URL.startsWith('http://'))
      .map(([name]) => name);
    expect(http).toEqual(['development']);
    expect(profiles.production.env!.EXPO_PUBLIC_API_URL).toBe(PRODUCTION_API);
  });

  it('numbers store and tester builds automatically', () => {
    expect(profiles.preview.autoIncrement).toBe(true);
    expect(profiles.production.autoIncrement).toBe(true);
    expect(eas.cli.appVersionSource).toBe('remote');
  });

  it('accepts every profile as written except the placeholder host, which stops the build', () => {
    for (const [name, profile] of Object.entries(profiles)) {
      const check = () => checkApiUrlForProfile(profile.env!.EXPO_PUBLIC_API_URL, name);
      if (name === 'preview') expect(check).toThrow(/placeholder/);
      else expect(check).not.toThrow();
    }
  });

  it('refuses http for preview and production builds, and checks nothing outside EAS', () => {
    expect(() => checkApiUrlForProfile('http://192.168.1.20:8180', 'preview')).toThrow(/https/);
    expect(() => checkApiUrlForProfile('http://192.168.1.20:8180', 'production')).toThrow(/https/);
    expect(() => checkApiUrlForProfile('http://192.168.1.20:8180', 'development')).not.toThrow();
    expect(() => checkApiUrlForProfile('http://192.168.1.20:8180', undefined)).not.toThrow();
  });

  it('stops app.config.ts for a production build pointed at http', () => {
    const before = process.env.EAS_BUILD_PROFILE;
    process.env.EAS_BUILD_PROFILE = 'production';
    try {
      expect(() => resolve('http://10.0.2.2:8180')).toThrow(/https/);
      expect(resolve('https://api.alphafit-ai.com').extra?.apiUrl).toBe(PRODUCTION_API);
    } finally {
      if (before === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = before;
    }
  });

  it('allows cleartext traffic on Android in development builds only', () => {
    const manifest = () =>
      ({
        manifest: { $: {}, application: [{ $: { 'android:name': '.MainApplication' } }] },
      }) as never;
    const flag = (profile: string | undefined) =>
      (setCleartextTraffic(manifest(), profile) as { manifest: { application: { $: object }[] } })
        .manifest.application[0].$;
    expect(flag('development')).toMatchObject({ 'android:usesCleartextTraffic': 'true' });
    expect(flag('preview')).toMatchObject({ 'android:usesCleartextTraffic': 'false' });
    expect(flag('production')).toMatchObject({ 'android:usesCleartextTraffic': 'false' });
    expect(flag(undefined)).toMatchObject({ 'android:usesCleartextTraffic': 'false' });
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
