#!/usr/bin/env node
/**
 * Web export of the app for the dev-only screenshot and flow harness, against the mock api. The flag
 * makes metro.config.js stub native modules (web only).
 *
 *   node tools/preview/build.js          -> .preview/dist (then preview:shots, preview:flows, preview:marketing)
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const MOCK_API = 'http://localhost:4010';

/** Builds the web export. Returns the exit status of `expo export`. */
function build({ out = path.join(root, '.preview', 'dist') } = {}) {
  const env = { ...process.env, EXPO_PUBLIC_PREVIEW: '1', EXPO_PUBLIC_API_URL: MOCK_API, CI: '1' };
  // One command string (not an argument list) with shell: true, so nothing is concatenated unquoted.
  const r = spawnSync(`npx expo export --platform web --output-dir "${out}" --clear`, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  });
  return r.status ?? 1;
}

if (require.main === module) process.exit(build());

module.exports = { build, MOCK_API };
