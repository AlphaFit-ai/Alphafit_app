#!/usr/bin/env node
/**
 * Browser checks of the navigation and session flows against the mock api (dev tool, see README
 * "Visual preview"). It drives the real expo-router guards (`Stack.Protected`), which Jest cannot:
 *
 *   npm run preview:build && npm run preview:flows
 *
 * Exits 1 when a flow fails. Screenshots of each end state go to .preview/flows.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright-core');
const { server: mockApi } = require('./mock-api');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, '.preview', 'dist');
const OUT = path.join(ROOT, '.preview', 'flows');
const API_PORT = 4010;
const WEB_PORT = 8099;

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};
const web = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, url);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const setMode = (fail, patch = null) =>
  new Promise((resolve) => {
    const req = http.request({ port: API_PORT, path: '/__mode', method: 'POST' }, (r) =>
      r.resume().on('end', resolve)
    );
    req.end(JSON.stringify({ fail, patch }));
  });

const results = [];
async function flow(
  browser,
  name,
  { signedIn = true, firebase = true, mode = null, patch = null },
  run
) {
  await setMode(mode, patch);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(
    ({ signedIn, firebase }) => {
      localStorage.setItem('@alphafit_ai_theme', 'dark');
      localStorage.setItem('user_language', 'en');
      if (signedIn) localStorage.setItem('authToken', 'preview-token');
      if (!firebase) localStorage.setItem('preview-firebase-signed-out', '1');
    },
    { signedIn, firebase }
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  let outcome = 'ok';
  try {
    await run(page);
  } catch (e) {
    outcome = String(e.message || e).split('\n')[0];
  }
  await page
    .screenshot({ path: path.join(OUT, `${name.replace(/\W+/g, '-')}.png`) })
    .catch(() => undefined);
  await context.close();
  results.push({ name, outcome, errors });
  console.log(
    `${outcome === 'ok' ? 'PASS' : 'FAIL'}  ${name}${outcome === 'ok' ? '' : `\n      ${outcome}`}${errors.length ? `\n      page errors: ${errors[0]}` : ''}`
  );
}

const BASE = `http://localhost:${WEB_PORT}`;
const expectUrl = (page, part) =>
  page.waitForURL((u) => u.pathname.includes(part), { timeout: 15000 });

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  mockApi.listen(API_PORT);
  web.listen(WEB_PORT);
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    await flow(browser, 'signed in and onboarded: / opens Home', {}, async (page) => {
      await page.goto(`${BASE}/`);
      await expectUrl(page, '/home');
      await page.getByText('Your Journey').waitFor({ timeout: 15000 });
    });

    await flow(
      browser,
      'nobody signed in: / opens the intro',
      { signedIn: false, firebase: false },
      async (page) => {
        await page.goto(`${BASE}/`);
        await expectUrl(page, '/onboarding/intro');
      }
    );

    await flow(
      browser,
      'guard: signed out, typing /home sends you to the intro, not into the app',
      { signedIn: false, firebase: false },
      async (page) => {
        await page.goto(`${BASE}/home`);
        await expectUrl(page, '/onboarding/intro');
      }
    );

    await flow(
      browser,
      'guard: signed out, typing /profile/settings does not open it',
      { signedIn: false, firebase: false },
      async (page) => {
        await page.goto(`${BASE}/profile/settings`);
        await expectUrl(page, '/onboarding/intro');
      }
    );

    await flow(
      browser,
      'guard: signed in and onboarded cannot open the login screen',
      {},
      async (page) => {
        await page.goto(`${BASE}/onboarding/login`);
        await expectUrl(page, '/home');
      }
    );

    await flow(
      browser,
      'api down at launch: retry screen, not onboarding',
      { mode: 'offline' },
      async (page) => {
        await page.goto(`${BASE}/`);
        await page.getByText("We can't reach AlphaFit").waitFor({ timeout: 20000 });
        if (page.url().includes('/onboarding/source')) throw new Error('went to onboarding');
        await setMode(null); // the connection comes back
        await page.getByRole('button', { name: 'Try again' }).click();
        await expectUrl(page, '/home');
      }
    );

    await flow(
      browser,
      'api server error at launch: retry screen',
      { mode: '500' },
      async (page) => {
        await page.goto(`${BASE}/`);
        await page.getByText("We can't reach AlphaFit").waitFor({ timeout: 20000 });
      }
    );

    await flow(
      browser,
      'token rejected and Firebase session gone: signs out to login',
      { mode: '401', firebase: false },
      async (page) => {
        await page.goto(`${BASE}/`);
        await expectUrl(page, '/onboarding/');
        const path = new URL(page.url()).pathname;
        if (path.includes('/home')) throw new Error('stayed in the app');
      }
    );

    // ---- the scan result against PATCH /food-scans/{id} (CONTRACTS 3.6): a saved edit, a 409, a 404
    const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
    const editOnce = async (page, food) => {
      await page.getByRole('button', { name: 'Edit portions' }).click();
      await page.getByRole('button', { name: `Smaller portion of ${food}` }).click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
    };

    await flow(
      browser,
      'scan result: a saved edit shows the new calories and Saved',
      {},
      async (page) => {
        await page.goto(`${BASE}/diet/diet-statistics?scanId=scan-3`);
        await page.getByText('Grilled salmon').first().waitFor({ timeout: 20000 });
        await shot(page, 'scan-edit-1-before');
        await editOnce(page, 'Grilled salmon');
        await page.getByText('Saved', { exact: true }).waitFor({ timeout: 10000 });
        await page.getByText('468', { exact: true }).waitFor({ timeout: 10000 }); // 520 x 225 / 250
        if (await page.getByText(/this screen only/).count())
          throw new Error('showed the on-screen-only note');
        await shot(page, 'scan-edit-2-saved');
      }
    );

    await flow(
      browser,
      'scan result: a 409 rolls the edit back and says so',
      { patch: '409' },
      async (page) => {
        await page.goto(`${BASE}/diet/diet-statistics?scanId=scan-4`);
        await page.getByText('Pasta carbonara').first().waitFor({ timeout: 20000 });
        await editOnce(page, 'Pasta carbonara');
        await page.getByText(/changed or cannot be adjusted/).waitFor({ timeout: 10000 });
        await page.getByText('680', { exact: true }).waitFor({ timeout: 10000 }); // back to the saved value
        await shot(page, 'scan-edit-3-conflict');
      }
    );

    await flow(
      browser,
      'scan result: a 404 keeps the edit on screen and says the server cannot save it',
      { patch: '404' },
      async (page) => {
        await page.goto(`${BASE}/diet/diet-statistics?scanId=scan-1`);
        await page.getByText('Chicken salad').first().waitFor({ timeout: 20000 });
        await editOnce(page, 'Chicken salad');
        await page.getByText(/this server cannot save them yet/).waitFor({ timeout: 10000 });
        await page.getByText('378', { exact: true }).waitFor({ timeout: 10000 }); // 420 x 225 / 250, still shown
        await shot(page, 'scan-edit-4-not-supported');
      }
    );

    await flow(
      browser,
      'scan result: "Looks right" confirms a low-confidence scan',
      {},
      async (page) => {
        await page.goto(`${BASE}/diet/diet-statistics?scanId=scan-2`);
        await page.getByText('Is this right?').waitFor({ timeout: 20000 });
        await page.getByRole('button', { name: 'Looks right' }).click();
        await page.getByText('Is this right?').waitFor({ state: 'detached', timeout: 10000 });
        await shot(page, 'scan-edit-5-confirmed');
      }
    );

    await flow(
      browser,
      'history: a failed first page is an error with a retry, and retrying recovers',
      { mode: 'scans' },
      async (page) => {
        await page.goto(`${BASE}/history`);
        await page.getByText('Try again').first().waitFor({ timeout: 20000 });
        if (await page.getByText('No History Yet').count())
          throw new Error('showed the empty state');
        await shot(page, 'history-error');
        await setMode(null);
        await page.getByRole('button', { name: 'Try again' }).click();
        await page.getByText('Chicken salad').first().waitFor({ timeout: 15000 });
      }
    );

    await flow(
      browser,
      'logout in Profile: back to login, app screens locked',
      {},
      async (page) => {
        await page.goto(`${BASE}/profile`);
        await page.getByText('Ann Example').first().waitFor({ timeout: 15000 });
        await page.getByLabel('Logout').first().click();
        await page.getByText('Logout', { exact: true }).last().click();
        await expectUrl(page, '/onboarding/login');
        await page.goto(`${BASE}/home`);
        await expectUrl(page, '/onboarding/intro');
      }
    );
  } finally {
    await setMode(null);
    await browser.close();
    web.close();
    mockApi.close();
  }
  const failed = results.filter((r) => r.outcome !== 'ok');
  console.log(
    `${results.length - failed.length}/${results.length} flows passed. Screenshots: ${OUT}`
  );
  process.exit(failed.length ? 1 : 0);
})();
