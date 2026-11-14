#!/usr/bin/env node
/**
 * Proves an exported bundle does not contain the dev-only preview code (docs/CONTRACTS.md section 8:
 * the dev sign-in "must be absent from every build without EXPO_PUBLIC_PREVIEW=1").
 *
 *   npx expo export --platform android --output-dir <dir>
 *   node scripts/check-bundle.js <dir>                    fails if a preview marker is in the bundle
 *   node scripts/check-bundle.js <dir> --expect-present   the opposite, for a preview build (shows the
 *                                                          check can see the markers at all)
 *
 * The markers are text that only exists in src/preview and tools/preview/stubs. Hermes bytecode keeps
 * string literals readable, so a plain byte search works for Android, iOS and web bundles.
 */
const fs = require('fs');
const path = require('path');

const MARKERS = [
  'This sign-in link did not work', // src/preview/copy.ts
  'dev sign-in: ', // src/preview/devSignIn.ts (DevSignInError message)
  'alphafit-preview', // src/preview/PreviewBridge.tsx (message to the dev bar)
  'Enter a barcode', // src/preview/copy.ts (manual barcode entry)
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
    for (const marker of MARKERS)
      if (bytes.includes(Buffer.from(marker, 'utf8'))) found.add(marker);
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
