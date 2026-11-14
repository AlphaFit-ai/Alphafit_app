// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', '.preview/*', 'coverage/*'],
  },
  {
    // Node scripts and config files (CommonJS).
    files: [
      'scripts/**/*.js',
      'tools/preview/*.js',
      'jest.setup.js',
      'jest.globalSetup.js',
      '*.config.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        Buffer: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    // The frame and dev bar of the browser preview (tools/preview/shell): plain browser scripts.
    files: ['tools/preview/shell/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        HTMLElement: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    // Jest globals in the tests.
    files: ['__tests__/**/*.{ts,tsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
]);
