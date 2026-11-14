#!/usr/bin/env node
/**
 * Web export of the app for the dev preview. The flag makes metro.config.js stub native modules.
 *
 *   node tools/preview/build.js                          mock build -> .preview/dist (screenshots, flows)
 *   node tools/preview/build.js --api=<url> --out=<dir> --auth=token
 *                                                        what `npm run preview:serve` runs: the real
 *                                                        local api and the /dev-sign-in route
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const MOCK_API = 'http://localhost:4010';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(hit.indexOf('=') + 1) : fallback;
}

/** Builds the web preview. Returns the exit status of `expo export`. */
function build({ api = MOCK_API, out = path.join(root, '.preview', 'dist'), auth = '' } = {}) {
  const env = {
    ...process.env,
    EXPO_PUBLIC_PREVIEW: '1',
    EXPO_PUBLIC_API_URL: api,
    EXPO_PUBLIC_PREVIEW_AUTH: auth,
    CI: '1',
  };
  // One command string (not an argument list) with shell: true, so nothing is concatenated unquoted.
  const r = spawnSync(`npx expo export --platform web --output-dir "${out}" --clear`, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  });
  return r.status ?? 1;
}

if (require.main === module) {
  process.exit(
    build({
      api: arg('api', MOCK_API),
      out: path.resolve(root, arg('out', path.join('.preview', 'dist'))),
      auth: arg('auth', ''),
    })
  );
}

module.exports = { build, MOCK_API };
