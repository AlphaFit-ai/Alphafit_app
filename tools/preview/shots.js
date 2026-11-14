#!/usr/bin/env node
/**
 * Screenshots of the app's screens in a browser (dev tool, see README "Visual preview").
 *
 *   npm run preview:build     one-off: web export of the app into .preview/dist (stubs for native modules)
 *   npm run preview:shots     starts the mock api and a static server, writes PNGs to .preview/shots
 *
 * Options: --routes=/home,/profile   --sizes=390x844   --themes=light,dark   --states   (also error states)
 *
 * It shows layout, spacing, colours, text and translations. It cannot show native fonts and shadows,
 * the keyboard, safe areas, the camera, haptics, gestures or real performance.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright-core');
const { server: mockApi } = require('./mock-api');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, '.preview', 'dist');
const OUT = path.join(ROOT, '.preview', 'shots');
const API_PORT = 4010;
const WEB_PORT = 8099;

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(hit.indexOf('=') + 1) : fallback;
};

const SIGNED_OUT = ['/onboarding/intro', '/onboarding/login', '/onboarding/register'];
const SIGNED_IN = [
  '/onboarding/source',
  '/onboarding/age',
  '/onboarding/gender',
  '/onboarding/height',
  '/onboarding/fitness-level',
  '/onboarding/activity',
  '/onboarding/workouts',
  '/onboarding/equipment',
  '/onboarding/goal',
  '/home',
  '/workouts',
  '/diet',
  '/projections',
  '/profile',
  '/history',
  '/chatbot',
  '/profile/settings',
  '/profile/faq',
  '/profile/help-support',
  '/profile/account-details',
  '/profile/language',
  '/profile/manage-data?type=onboarding',
  '/diet/diet-preference',
  '/diet/allergies',
  '/diet/meals',
  '/diet/supplements',
  '/projection/sleep',
  '/projection/steps',
  '/projection/stress',
  '/diet/diet-statistics?scanId=scan-1',
  '/diet/diet-statistics?scanId=scan-2',
];
const ERROR_STATE_ROUTES = ['/home', '/diet', '/profile', '/history'];

const routes = arg('routes', null)?.split(',') ?? [...SIGNED_OUT, ...SIGNED_IN];
const sizes = arg('sizes', '390x844,360x740')
  .split(',')
  .map((s) => s.split('x').map(Number));
const themes = arg('themes', 'light,dark').split(',');
const withStates = process.argv.includes('--states');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.map': 'application/json',
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

const slug = (route) => route.replace(/^\//, '').replace(/[^\w]+/g, '-') || 'root';
const setMode = (fail) =>
  new Promise((resolve) => {
    const req = http.request({ port: API_PORT, path: '/__mode', method: 'POST' }, (r) =>
      r.resume().on('end', resolve)
    );
    req.end(JSON.stringify({ fail }));
  });

async function shoot(browser, { route, w, h, theme, signedIn, label }) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  await context.addInitScript(
    ({ theme, signedIn }) => {
      localStorage.setItem('@alphafit_ai_theme', theme);
      localStorage.setItem('user_language', 'en');
      if (signedIn) {
        localStorage.setItem('authToken', 'preview-token');
        localStorage.setItem('userId', 'u1');
      } else {
        // Signed-out mode: no api token, and the stubbed Firebase has no user either, so the launch
        // check lands on the intro and nothing signs the visitor in.
        localStorage.setItem('preview-firebase-signed-out', '1');
      }
    },
    { theme, signedIn }
  );
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(String(e).split('\n')[0]));
  await page
    .goto(`http://localhost:${WEB_PORT}${route}`, { waitUntil: 'networkidle' })
    .catch(() => undefined);
  await page.waitForTimeout(1200);
  const file = path.join(OUT, `${slug(route)}${label}__${w}x${h}__${theme}.png`);
  await page.screenshot({ path: file });
  await context.close();
  return { file, problems };
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('No web export found. Run: npm run preview:build');
    process.exit(1);
  }
  // A full run starts from an empty folder; a run for chosen --routes only adds or replaces its files.
  if (!arg('routes', null)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  mockApi.listen(API_PORT);
  const web = staticServer().listen(WEB_PORT);
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = [];
  try {
    for (const route of routes) {
      for (const [w, h] of sizes) {
        for (const theme of themes) {
          const signedIn = !SIGNED_OUT.includes(route);
          const r = await shoot(browser, { route, w, h, theme, signedIn, label: '' });
          report.push(r);
          if (r.problems.length) console.log(`! ${route} ${w}x${h} ${theme}: ${r.problems[0]}`);
        }
      }
    }
    if (withStates) {
      for (const fail of ['offline', '500']) {
        await setMode(fail);
        for (const route of ERROR_STATE_ROUTES) {
          await shoot(browser, {
            route,
            w: 390,
            h: 844,
            theme: 'dark',
            signedIn: true,
            label: `--${fail}`,
          });
        }
      }
      await setMode(null);
    }
  } finally {
    await browser.close();
    web.close();
    mockApi.close();
  }
  console.log(`${fs.readdirSync(OUT).length} screenshots in ${OUT}`);
  process.exit(0);
})();
