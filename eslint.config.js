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
      'jest.resolver.js',
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
    // Jest globals in the tests. Test probes write what a hook returned into a variable outside the
    // component on purpose, which the React Compiler check (react-hooks/globals) forbids in app code.
    files: ['__tests__/**/*.{ts,tsx}', 'jest.setup.js'],
    rules: { 'react-hooks/globals': 'off' },
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
