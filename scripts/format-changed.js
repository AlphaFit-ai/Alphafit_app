#!/usr/bin/env node
/**
 * Prettier for the files a branch changed, not the whole repository.
 *
 *   node scripts/format-changed.js --check     list unformatted files and exit 1 (used by CI)
 *   node scripts/format-changed.js --write     format them
 *
 * "Changed" means different from the base branch (committed, staged, edited or new). Older files that
 * nobody touches keep their old formatting, so a formatting pass never buries a real change in the
 * diff; a file is formatted the first time a branch edits it.
 *
 * The base is `FORMAT_BASE` if set (CI sets it to the pull request target, for example
 * `origin/main`), otherwise the first of `origin/main` and `main` that exists.
 */
const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXTENSIONS = /\.(ts|tsx|js|cjs|mjs|json)$/;
const NEVER = /(^|\/)(package-lock\.json|google-services\.json)$/;

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function refExists(ref) {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

function resolveBase() {
  const candidates = [process.env.FORMAT_BASE, 'origin/main', 'main'].filter(Boolean);
  const found = candidates.find(refExists);
  if (!found) {
    console.error(
      `Cannot find a base branch to compare with (tried ${candidates.join(', ')}). Set FORMAT_BASE.`
    );
    process.exit(2);
  }
  return found;
}

function changedFiles(base) {
  // Everything that differs from where this branch left the base, plus files git does not track yet.
  const mergeBase = git('merge-base', base, 'HEAD');
  const changed = git('diff', '--name-only', '--diff-filter=ACMR', mergeBase)
    .split('\n')
    .concat(git('ls-files', '--others', '--exclude-standard').split('\n'))
    .map((file) => file.trim())
    .filter(Boolean);
  return [...new Set(changed)].filter((file) => EXTENSIONS.test(file) && !NEVER.test(file)).sort();
}

const mode = process.argv.includes('--write') ? '--write' : '--check';
const base = resolveBase();
const files = changedFiles(base);

if (files.length === 0) {
  console.log(`No changed files to format (compared with ${base}).`);
  process.exit(0);
}

const prettier = require.resolve('prettier/bin/prettier.cjs');
const result = spawnSync(process.execPath, [prettier, mode, '--ignore-unknown', ...files], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (mode === '--check') {
  console.log(
    result.status === 0
      ? `Formatting is correct in ${files.length} changed file(s) (compared with ${base}).`
      : 'Run "npm run format" to fix the files above.'
  );
}
process.exit(result.status ?? 1);
