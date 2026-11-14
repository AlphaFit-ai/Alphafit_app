#!/usr/bin/env node
/**
 * Proves an exported bundle does not contain the dev-only web harness code: the stand-ins for native
 * modules in tools/preview/stubs (a fake signed-in Firebase user, a localStorage token store), which
 * metro.config.js swaps in only for a web export with EXPO_PUBLIC_PREVIEW=1.
 *
 *   npx expo export --platform android --output-dir <dir>
 *   node scripts/check-bundle.js <dir>                    fails if a harness marker is in the bundle
 *   node scripts/check-bundle.js <dir> --expect-present   the opposite, for the harness build
 *                                                          (.preview/dist): the check can see them at all
 *
 * The markers are text that only exists in tools/preview/stubs. Hermes bytecode keeps string literals
 * readable, so a plain byte search works for Android, iOS and web bundles.
 */
const fs = require('fs');
const path = require('path');

// Development-only code that no export may contain, whatever the mode: the navigation trace that
// app/_layout.tsx loads only when __DEV__ is true (src/dev/NavigationTrace.tsx).
const DEV_ONLY = ['[alphafit-trace]'];

const MARKERS = [
  'preview-firebase-signed-out', // tools/preview/stubs/firebase-auth.js
  'preview-firebase-id-token', // tools/preview/stubs/firebase-auth.js (the fake user's token)
  'preview-secure:', // tools/preview/stubs/secure-store.js
];

function bundles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(hbc|js|bundle)$/.test(entry.name)) out.push(full);
    }
  };
  walk(path.join(dir, '_expo', 'static', 'js'));
  return out;
}

function main() {
  const dir = process.argv[2];
  const expectPresent = process.argv.includes('--expect-present');
  if (!dir || !fs.existsSync(path.join(dir, '_expo'))) {
    console.error(
      'usage: node scripts/check-bundle.js <expo export output dir> [--expect-present]'
    );
    process.exit(2);
  }
  const files = bundles(dir);
  if (files.length === 0) {
    console.error(`No bundle found under ${dir}/_expo/static/js`);
    process.exit(2);
  }
  const found = new Set();
  for (const file of files) {
    const bytes = fs.readFileSync(file);
    for (const marker of [...MARKERS, ...DEV_ONLY])
      if (bytes.includes(Buffer.from(marker, 'utf8'))) found.add(marker);
  }
  const devOnly = DEV_ONLY.filter((m) => found.has(m));
  if (devOnly.length) {
    console.error(`Development-only code found in an export: ${devOnly.join(' | ')}`);
    process.exit(1);
  }
  if (expectPresent) {
    const missing = MARKERS.filter((m) => !found.has(m));
    if (missing.length) {
      console.error(`Expected the preview code in this bundle; missing: ${missing.join(' | ')}`);
      process.exit(1);
    }
    console.log(`Preview code present in ${files.length} bundle file(s), as expected.`);
    return;
  }
  if (found.size) {
    console.error(`Dev-only preview code found in an app bundle: ${[...found].join(' | ')}`);
    process.exit(1);
  }
  console.log(`No dev-only preview code in ${files.length} bundle file(s).`);
}

main();
