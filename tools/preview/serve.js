#!/usr/bin/env node
/**
 * The owner's browser preview of the app against the REAL local stack (docs/CONTRACTS.md section 8).
 *
 *   npm run preview:serve                       build, then serve http://localhost:8184
 *   npm run preview:serve -- --no-build         serve the last build again (faster)
 *   npm run preview:serve -- --api=http://localhost:8180 --port=8184
 *
 * EXPO_PUBLIC_API_URL and PREVIEW_PORT work too. Sign in with the link `Alphafit-manifests/compose/
 * demo-token` prints. Ctrl+C stops it. Dev only: never deployed, never part of an app build.
 *
 * On a wide window the app is shown at phone size in a simple frame, with a dev bar beside it (theme,
 * size, who is signed in, sign out); on a narrow window the app fills the page.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { build } = require('./build');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, '.preview', 'serve');
const SHELL = path.join(__dirname, 'shell');

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(hit.indexOf('=') + 1) : fallback;
}

const API = (arg('api', process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8180') || '').replace(
  /\/+$/,
  ''
);
const PORT = Number(arg('port', process.env.PREVIEW_PORT || 8184));
const ORIGIN = `http://localhost:${PORT}`;
const TOKEN_HINT_WINDOWS = 'Alphafit-manifests\\compose\\demo-token.ps1';
const TOKEN_HINT_UNIX = './Alphafit-manifests/compose/demo-token.sh';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * The exported index.html with its bundle tag replaced by a small loader: in a wide, top-level window
 * it loads the frame and dev bar (shell.js) instead of the app; everywhere else (inside that frame, or
 * a narrow window) it loads the app.
 */
function previewHtml(indexHtml) {
  const match = indexHtml.match(/<script src="([^"]+)" defer><\/script>/);
  if (!match) throw new Error('index.html: the bundle <script> tag was not found');
  const loader = `<script>
(function () {
  var ENTRY = ${JSON.stringify(match[1])};
  window.__ALPHAFIT_PREVIEW__ = ${JSON.stringify({
    api: API,
    tokenHints: [TOKEN_HINT_WINDOWS, TOKEN_HINT_UNIX],
  })};
  function wide() { return window.innerWidth >= 900 && window.innerHeight >= 600; }
  var framed = window.top !== window;
  if (!framed) {
    // A sign-in link opened in a tab that already shows the preview only changes the fragment: start
    // again so the token is read (and removed from the address bar).
    window.addEventListener('hashchange', function () {
      if (/(^#|&)token=/.test(location.hash)) location.reload();
    });
  }
  if (!framed && wide()) {
    var shell = document.createElement('script');
    shell.src = '/__preview/shell.js';
    shell.setAttribute('data-entry', ENTRY);
    document.body.appendChild(shell);
    return;
  }
  var app = document.createElement('script');
  app.src = ENTRY;
  document.body.appendChild(app);
  if (!framed) {
    // A narrow window that becomes wide gets the frame and the dev bar.
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (wide()) location.reload(); }, 400);
    });
  }
})();
</script>`;
  return indexHtml.replace(match[0], loader);
}

function send(res, status, type, body, extra = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  });
  res.end(body);
}

function createHandler(html) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed', {
        Allow: 'GET, HEAD',
      });
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    } catch {
      return send(res, 400, 'text/plain; charset=utf-8', 'Bad request');
    }

    // The frame and dev bar.
    if (pathname.startsWith('/__preview/')) {
      const file = path.join(SHELL, path.basename(pathname));
      if (!file.startsWith(SHELL) || !fs.existsSync(file)) {
        return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
      }
      return send(
        res,
        200,
        TYPES[path.extname(file)] || 'application/octet-stream',
        fs.readFileSync(file),
        {
          'Cache-Control': 'no-store',
        }
      );
    }

    const file = path.join(OUT, pathname);
    if (
      file.startsWith(OUT) &&
      pathname !== '/' &&
      fs.existsSync(file) &&
      fs.statSync(file).isFile()
    ) {
      const hashed = pathname.startsWith('/_expo/') || pathname.startsWith('/assets/');
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file).pipe(res);
    }
    // A missing file is a 404; any other path is a route of the app (single-page fallback).
    if (path.extname(pathname)) return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
    return send(res, 200, TYPES['.html'], html, { 'Cache-Control': 'no-store' });
  };
}

function listen(server, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, host, () => resolve(server));
  });
}

/** Does the api answer, and does it accept this page's origin (CORS)? Warnings only. */
async function checkApi() {
  try {
    const health = await fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) });
    if (!health.ok) console.warn(`! The api at ${API} answered ${health.status} on /health.`);
  } catch {
    console.warn(
      `! The api at ${API} does not answer. Start the local stack: Alphafit-manifests\\compose\\up.ps1`
    );
    return;
  }
  try {
    const preflight = await fetch(`${API}/users/profile`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
      signal: AbortSignal.timeout(5000),
    });
    const allowed = preflight.headers.get('access-control-allow-origin');
    if (!preflight.ok || allowed !== ORIGIN) {
      console.warn(
        `! The api refuses requests from ${ORIGIN} (CORS preflight: ${preflight.status}, ` +
          `Access-Control-Allow-Origin: ${allowed ?? 'none'}). Add ${ORIGIN} to CORS_ALLOWED_ORIGINS ` +
          'in Alphafit-manifests/compose/.env and restart the api.'
      );
    }
  } catch {
    // the health check above already said the api is unreachable
  }
}

async function main() {
  if (!process.argv.includes('--no-build')) {
    console.log(`Building the preview for the api at ${API} (about a minute)...`);
    if (build({ api: API, out: OUT, auth: 'token' }) !== 0) {
      console.error('The preview build failed (see above).');
      process.exit(1);
    }
  }
  const index = path.join(OUT, 'index.html');
  if (!fs.existsSync(index)) {
    console.error('No preview build found. Run: npm run preview:serve (without --no-build).');
    process.exit(1);
  }
  const handler = createHandler(previewHtml(fs.readFileSync(index, 'utf8')));

  const servers = [];
  try {
    servers.push(await listen(http.createServer(handler), '127.0.0.1'));
  } catch (error) {
    console.error(
      error.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use (is another preview running?). Stop it, or use --port=<n>.`
        : `Could not start the preview server: ${error.message}`
    );
    process.exit(1);
  }
  try {
    // Windows resolves "localhost" to ::1 first.
    servers.push(await listen(http.createServer(handler), '::1'));
  } catch {
    // no IPv6 loopback: 127.0.0.1 is enough
  }

  await checkApi();
  console.log('');
  console.log(`AlphaFit preview ready: ${ORIGIN}   (api: ${API})`);
  console.log(
    `Sign in: run ${TOKEN_HINT_WINDOWS} (or ${TOKEN_HINT_UNIX}) and open the link it prints.`
  );
  console.log('Press Ctrl+C to stop.');

  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    let open = servers.length;
    const done = () => {
      open -= 1;
      if (open <= 0) {
        console.log('Preview stopped.');
        process.exit(0);
      }
    };
    servers.forEach((s) => {
      s.close(done);
      s.closeAllConnections?.();
    });
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { previewHtml, createHandler };
