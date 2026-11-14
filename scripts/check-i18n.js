#!/usr/bin/env node
/**
 * Translation audit.
 *
 *  - parity:  the three locale files (en, fr, es) must hold exactly the same keys,
 *             and each key must use the same {{placeholders}} in every locale.
 *  - missing: translation keys used in code (static `t('a.b')` calls) that exist in no locale
 *             (or, per locale, are absent from that locale).
 *  - unused:  keys defined in a locale but never referenced by code. Informational only.
 *
 * Keys built with a template literal (`t(`a.${x}`)`) count as dynamic: every key that starts with
 * the static prefix is treated as used.
 *
 * Usage:  node scripts/check-i18n.js [--json]      exits 1 on parity or missing-key failures.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES = ['en', 'fr', 'es'];
const REFERENCE = 'en';
const SOURCE_DIRS = ['app', 'components', 'context', 'hooks', 'i18n', 'services', 'src'];
const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/;

function readLocale(root, code) {
  const file = path.join(root, 'i18n', 'locales', `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Flatten nested JSON into { 'a.b.c': 'value' }.
 * @param {object} obj
 * @param {string} [prefix]
 * @param {Record<string, string>} [out]
 * @returns {Record<string, string>}
 */
function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      flatten(value, full, out);
    } else {
      out[full] = String(value);
    }
  }
  return out;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

// t('key'), t("key"), i18n.t('key'), t(`key`) with an optional second argument.
const CALL = /(?<![\w$.])(?:i18n\.)?t\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

// Any quoted string that looks like a dotted key. Keys kept in a lookup table (for example
// `{ 'auth/weak-password': 'authErrors.weakPassword' }`) are referenced this way instead of by `t('...')`.
const LITERAL = /(['"])([A-Za-z][\w-]*(?:\.[\w-]+)+)\1/g;
// The same, only as the value of a property (`titleKey: 'home.title'`): these are also checked for typos.
const LITERAL_VALUE = /:\s*(['"])([A-Za-z][\w-]*(?:\.[\w-]+)+)\1/g;

/**
 * Returns { staticKeys, literalKeys, valueKeys, dynamicPrefixes }, each key mapping to the files that
 * use it. `staticKeys` are the `t('...')` calls; `literalKeys` every other key-shaped string;
 * `valueKeys` those that are property values.
 */
function collectUsedKeys(root) {
  const staticKeys = new Map();
  const literalKeys = new Map();
  const valueKeys = new Map();
  const dynamicPrefixes = new Set();
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(path.join(root, dir))) {
      const text = fs.readFileSync(file, 'utf8');
      const rel = path.relative(root, file).replace(/\\/g, '/');
      let match;
      CALL.lastIndex = 0;
      while ((match = CALL.exec(text)) !== null) {
        const [, quote, raw] = match;
        if (quote === '`' && raw.includes('${')) {
          const prefix = raw.slice(0, raw.indexOf('${'));
          if (prefix) dynamicPrefixes.add(prefix);
          continue;
        }
        // Only things that look like keys: dotted identifiers.
        if (!/^[A-Za-z][\w-]*(\.[\w-]+)+$/.test(raw)) continue;
        if (!staticKeys.has(raw)) staticKeys.set(raw, []);
        const files = staticKeys.get(raw);
        if (!files.includes(rel)) files.push(rel);
      }
      LITERAL.lastIndex = 0;
      while ((match = LITERAL.exec(text)) !== null) {
        const key = match[2];
        if (!literalKeys.has(key)) literalKeys.set(key, []);
        const files = literalKeys.get(key);
        if (!files.includes(rel)) files.push(rel);
      }
      LITERAL_VALUE.lastIndex = 0;
      while ((match = LITERAL_VALUE.exec(text)) !== null) {
        const key = match[2];
        if (!valueKeys.has(key)) valueKeys.set(key, []);
        const files = valueKeys.get(key);
        if (!files.includes(rel)) files.push(rel);
      }
    }
  }
  return { staticKeys, literalKeys, valueKeys, dynamicPrefixes };
}

function placeholders(value) {
  return [...value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');
}

function analyze(root = ROOT) {
  const flat = {};
  for (const code of LOCALES) flat[code] = flatten(readLocale(root, code));

  const refKeys = Object.keys(flat[REFERENCE]);
  const parity = { missingIn: {}, placeholderMismatch: [] };
  for (const code of LOCALES) {
    if (code === REFERENCE) continue;
    const keys = new Set(Object.keys(flat[code]));
    parity.missingIn[`${code} (absent, present in ${REFERENCE})`] = refKeys.filter(
      (k) => !keys.has(k)
    );
    parity.missingIn[`${code} (extra, absent from ${REFERENCE})`] = [...keys].filter(
      (k) => !(k in flat[REFERENCE])
    );
  }
  for (const key of refKeys) {
    const expected = placeholders(flat[REFERENCE][key]);
    for (const code of LOCALES) {
      if (code === REFERENCE || !(key in flat[code])) continue;
      if (placeholders(flat[code][key]) !== expected) {
        parity.placeholderMismatch.push({ key, locale: code });
      }
    }
  }

  const { staticKeys, literalKeys, valueKeys, dynamicPrefixes } = collectUsedKeys(root);
  const missingEverywhere = [];
  const missingPerLocale = {};
  for (const code of LOCALES) missingPerLocale[code] = [];
  for (const [key, files] of staticKeys) {
    const present = LOCALES.filter((code) => key in flat[code]);
    if (present.length === 0) missingEverywhere.push({ key, files });
    for (const code of LOCALES) if (!(key in flat[code])) missingPerLocale[code].push(key);
  }

  // A property value shaped like a key in one of our namespaces (`titleKey: 'home.title'`) that is not
  // defined is a typo in a lookup table.
  const namespaces = new Set(refKeys.map((key) => key.split('.')[0]));
  for (const [key, files] of valueKeys) {
    if (staticKeys.has(key) || key in flat[REFERENCE]) continue;
    if (!namespaces.has(key.split('.')[0])) continue;
    missingEverywhere.push({ key, files });
  }

  const used = new Set([
    ...staticKeys.keys(),
    ...[...literalKeys.keys()].filter((k) => k in flat[REFERENCE]),
  ]);
  const unused = refKeys.filter(
    (key) => !used.has(key) && ![...dynamicPrefixes].some((prefix) => key.startsWith(prefix))
  );

  const parityFailures =
    Object.values(parity.missingIn).reduce((n, list) => n + list.length, 0) +
    parity.placeholderMismatch.length;

  return {
    counts: Object.fromEntries(LOCALES.map((code) => [code, Object.keys(flat[code]).length])),
    parity,
    missingEverywhere,
    missingPerLocale,
    unused,
    dynamicPrefixes: [...dynamicPrefixes].sort(),
    ok:
      parityFailures === 0 &&
      missingEverywhere.length === 0 &&
      Object.values(missingPerLocale).every((list) => list.length === 0),
  };
}

function report(result) {
  const lines = [];
  lines.push(
    `Keys per locale: ${Object.entries(result.counts)
      .map(([k, v]) => `${k}=${v}`)
      .join('  ')}`
  );
  for (const [label, list] of Object.entries(result.parity.missingIn)) {
    if (list.length) lines.push(`PARITY  ${label}: ${list.length} key(s)\n  ${list.join('\n  ')}`);
  }
  if (result.parity.placeholderMismatch.length) {
    lines.push(
      `PARITY  placeholder mismatch: ${result.parity.placeholderMismatch
        .map((m) => `${m.key} [${m.locale}]`)
        .join(', ')}`
    );
  }
  if (result.missingEverywhere.length) {
    lines.push(
      `MISSING used in code but defined in no locale: ${result.missingEverywhere.length}\n  ` +
        result.missingEverywhere.map((m) => `${m.key}  (${m.files.join(', ')})`).join('\n  ')
    );
  }
  for (const [code, list] of Object.entries(result.missingPerLocale)) {
    if (list.length) lines.push(`MISSING in ${code}: ${list.length} key(s)`);
  }
  lines.push(`UNUSED  defined but never referenced (informational): ${result.unused.length}`);
  if (result.unused.length) lines.push('  ' + result.unused.join('\n  '));
  lines.push(result.ok ? 'i18n check passed.' : 'i18n check FAILED.');
  return lines.join('\n');
}

module.exports = { analyze, flatten, report, collectUsedKeys };

if (require.main === module) {
  const result = analyze();
  console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : report(result));
  process.exit(result.ok ? 0 : 1);
}
