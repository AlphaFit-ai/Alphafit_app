/**
 * The dev-only web preview replaces native modules with stubs through metro.config.js. That must
 * never happen in a build that people install: EAS builds do not set the flag and do not build for web.
 */
type Resolver = (
  context: { resolveRequest: (c: unknown, name: string, platform: string) => unknown },
  name: string,
  platform: string
) => { filePath?: string } | undefined;

function loadResolver(flag: string | undefined): Resolver | undefined {
  const { withPreviewStubs } = jest.requireActual('../tools/preview/metro-stubs');
  const config = { resolver: {} as { resolveRequest?: Resolver } };
  withPreviewStubs(config, flag === undefined ? {} : { EXPO_PUBLIC_PREVIEW: flag });
  return config.resolver.resolveRequest;
}

const passthrough = { resolveRequest: () => ({ type: 'sourceFile', filePath: 'real-module' }) };

describe('metro preview stubs', () => {
  it('stubs nothing without the preview flag, on any platform', () => {
    expect(loadResolver(undefined)).toBeUndefined(); // the config is not touched at all
    const resolver = loadResolver('0');
    expect(resolver).toBeUndefined();
    for (const platform of ['android', 'ios', 'web']) {
      for (const name of [
        'expo-secure-store',
        'firebase/auth',
        '@react-native-google-signin/google-signin',
      ]) {
        const resolved = resolver?.(passthrough, name, platform);
        expect(resolved?.filePath ?? 'real-module').toBe('real-module');
      }
    }
  });

  it('with the flag, stubs the native modules for web only', () => {
    const resolver = loadResolver('1');
    expect(resolver).toBeDefined();
    const web = resolver!(passthrough, 'expo-secure-store', 'web');
    expect(web?.filePath).toMatch(/tools[\\/]preview[\\/]stubs[\\/]secure-store\.js$/);
    expect(resolver!(passthrough, 'expo-secure-store', 'android')?.filePath).toBe('real-module');
    expect(resolver!(passthrough, 'expo-secure-store', 'ios')?.filePath).toBe('real-module');
  });

  it('keeps the web tooling out of the runtime dependencies', () => {
    const pkg = require('../package.json');
    for (const name of [
      'react-native-web',
      'react-dom',
      '@expo/metro-runtime',
      'playwright-core',
    ]) {
      expect(pkg.dependencies[name]).toBeUndefined();
      expect(pkg.devDependencies[name]).toBeDefined();
    }
  });
});
