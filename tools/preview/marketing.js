#!/usr/bin/env node
/**
 * Marketing screenshots (dev tool): Home, a scan result with a real food photo, History, Workouts and the
 * coach chat, light and dark, at 390x844 and 2x (780x1688 PNG). Data is the mock api's marketing set: a
 * made-up "Demo User", real photos from the vision repo's test fixtures (public domain and CC0 only) and
 * a short sample chat. Nothing is fetched from the real api; no real name or e-mail appears.
 *
 *   npm run preview:build        once (or after a change): web export against the mock api
 *   npm run preview:marketing    PNGs and PHOTO-LICENSES.md in .preview/marketing (git-ignored)
 *
 * Options: --themes=light,dark  --size=390x844
 *
 * A browser cannot draw the phone's status bar, native fonts or shadows exactly as a device does; for
 * store listings, take the final pictures from a device build with the same data.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright-core');
const { server: mockApi, useMarketingData, FOOD_PHOTOS } = require('./mock-api');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, '.preview', 'dist');
const OUT = path.join(ROOT, '.preview', 'marketing');
const API_PORT = 4010;
const WEB_PORT = 8098;

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(hit.indexOf('=') + 1) : fallback;
};
const themes = arg('themes', 'light,dark').split(',');
const [W, H] = arg('size', '390x844').split('x').map(Number);

// [file, route, then]: `then` opens the next screen the way a user does (the result over History).
const SCREENS = [
  ['01-home', '/home'],
  ['02-scan-result', '/history', (page) => page.getByText('Sushi').first().click()],
  ['03-history', '/history'],
  ['04-workouts', '/workouts'],
  ['05-coach', '/chatbot'],
];
// The screenshots' clock: today at 20:15 local time, after the day's meals.
const ANCHOR = new Date();
ANCHOR.setHours(20, 15, 0, 0);
const PHOTOS = ['sushi', 'spaghetti', 'cake', 'hamburger'];

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};
function staticServer() {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(DIST, url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

/** The licence rows of the photos used, copied from the fixtures' LICENSES.md, next to the PNGs. */
function writeLicences() {
  const source = path.join(FOOD_PHOTOS, 'LICENSES.md');
  const rows = fs
    .readFileSync(source, 'utf8')
    .split('\n')
    .filter(
      (line) =>
        line.startsWith('| File') ||
        line.startsWith('|---') ||
        PHOTOS.some((p) => line.startsWith(`| \`${p}.jpg\``))
    );
  const text = [
    '# Photos in these screenshots',
    '',
    `Copied from \`Scan_Food/tests/fixtures/images/LICENSES.md\` (Wikimedia Commons, downscaled). Only public-domain and CC0 files are used, so no attribution is required; it is kept here so anyone reusing a screenshot can check.`,
    '',
    ...rows,
    '',
    'All names, numbers and chat messages in the screenshots are made up ("Demo User").',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'PHOTO-LICENSES.md'), text);
  for (const photo of PHOTOS) {
    const row = rows.find((line) => line.startsWith(`| \`${photo}.jpg\``)) || '';
    if (!/Public domain|CC0/.test(row)) throw new Error(`${photo}.jpg is not public domain or CC0`);
  }
}

async function shoot(browser, theme, name, route, then) {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  await context.clock.setFixedTime(ANCHOR);
  await context.addInitScript((t) => {
    localStorage.setItem('@alphafit_ai_theme', t);
    localStorage.setItem('user_language', 'en');
    localStorage.setItem('authToken', 'preview-token');
    localStorage.setItem('userId', 'u1');
  }, theme);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(String(e).split('\n')[0]));
  await page
    .goto(`http://localhost:${WEB_PORT}${route}`, { waitUntil: 'networkidle' })
    .catch(() => undefined);
  // Photos fade in (expo-image): wait for every <img> to be decoded, then for the transition.
  const settle = async () => {
    await page
      .waitForFunction(() => [...document.images].every((img) => img.complete), null, {
        timeout: 8000,
      })
      .catch(() => undefined);
    await page.waitForTimeout(1500);
  };
  await settle();
  if (then) {
    await then(page);
    await settle();
  }
  const file = path.join(OUT, `${name}-${theme}.png`);
  await page.screenshot({ path: file });
  await context.close();
  if (problems.length) console.log(`! ${route} ${theme}: ${problems[0]}`);
  return file;
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('No web export found. Run: npm run preview:build');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(FOOD_PHOTOS, 'sushi.jpg'))) {
    console.error(`Food photos not found in ${FOOD_PHOTOS} (set FOOD_PHOTOS_DIR).`);
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  writeLicences();
  useMarketingData(ANCHOR.getTime());
  mockApi.listen(API_PORT);
  const web = staticServer().listen(WEB_PORT);
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const theme of themes)
      for (const [name, route, then] of SCREENS) await shoot(browser, theme, name, route, then);
  } finally {
    await browser.close();
    web.close();
    mockApi.close();
  }
  console.log(`${fs.readdirSync(OUT).length} files in ${OUT}`);
  process.exit(0);
})();
