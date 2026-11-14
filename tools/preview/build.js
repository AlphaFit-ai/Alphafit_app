#!/usr/bin/env node
// Web export for the dev preview: .preview/dist. The flag makes metro.config.js stub native modules.
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const out = path.join(root, '.preview', 'dist');
const env = {
  ...process.env,
  EXPO_PUBLIC_PREVIEW: '1',
  EXPO_PUBLIC_API_URL: 'http://localhost:4010',
  CI: '1',
};
const r = spawnSync(
  'npx',
  ['expo', 'export', '--platform', 'web', '--output-dir', out, '--clear'],
  {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  }
);
process.exit(r.status ?? 1);
