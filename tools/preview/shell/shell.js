/*
 * The frame around the app in the browser preview (tools/preview/serve.js), on wide windows only: the
 * app runs at phone size in an iframe, and a small dev bar outside it switches the theme and the size,
 * says who is signed in, and signs out. Dev only.
 */
(function () {
  'use strict';
  let config = window.__ALPHAFIT_PREVIEW__ || { api: '', tokenHints: [] };
  let SIZES = [
    { id: '390x844', w: 390, h: 844, label: '390 × 844' },
    { id: '360x740', w: 360, h: 740, label: '360 × 740' },
  ];
  let BEZEL = 12;
  let SIZE_KEY = 'preview-shell-size';

  function savedSize() {
    try {
      let id = localStorage.getItem(SIZE_KEY);
      for (let i = 0; i < SIZES.length; i++) if (SIZES[i].id === id) return SIZES[i];
    } catch {
      /* storage blocked */
    }
    return SIZES[0];
  }

  let state = { size: savedSize(), theme: null, status: 'loading', name: null, email: null };

  // The address the page was opened with, token fragment included, goes to the frame; the address bar
  // keeps no token.
  let start = location.pathname + location.search + location.hash;
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);

  let css = [
    'html,body{height:100%;margin:0}',
    'body{background:#0b1020;color:#e5e7eb;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden}',
    '#preview-root{display:flex;height:100%;align-items:center;justify-content:center;gap:40px;padding:24px;box-sizing:border-box}',
    '.bar{width:250px;display:flex;flex-direction:column;gap:18px}',
    '.brand{font-weight:700;font-size:16px;letter-spacing:.02em}',
    '.brand small{display:block;font-weight:500;color:#9ca3af;font-size:12px;margin-top:2px}',
    '.group{display:flex;flex-direction:column;gap:8px}',
    '.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}',
    '.seg{display:flex;background:#1f2937;border-radius:999px;padding:3px}',
    '.seg button{flex:1;border:0;background:transparent;color:#e5e7eb;font:inherit;padding:7px 10px;border-radius:999px;cursor:pointer;min-height:34px}',
    '.seg button[aria-pressed="true"]{background:#ff6b4a;color:#111827;font-weight:600}',
    '.seg button:focus-visible,.action:focus-visible{outline:2px solid #ff8c6d;outline-offset:2px}',
    '.who{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:10px 12px}',
    '.who strong{display:block;color:#fff}',
    '.who code{display:block;margin-top:6px;font:12px/1.4 ui-monospace,Consolas,monospace;color:#fcd34d;word-break:break-all}',
    '.action{border:1px solid #4b5563;background:transparent;color:#e5e7eb;font:inherit;border-radius:999px;padding:8px 14px;cursor:pointer;min-height:36px}',
    '.action:disabled{opacity:.4;cursor:default}',
    '.api{font-size:12px;color:#9ca3af;word-break:break-all}',
    '.stage{display:flex;align-items:center;justify-content:center}',
    '.phone{background:#000;border-radius:52px;padding:' +
      BEZEL +
      'px;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 2px #2b3445;transform-origin:center center}',
    '.phone iframe{display:block;border:0;border-radius:40px;background:#fff}',
  ].join('\n');

  document.title = 'AlphaFit AI preview';
  let style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  let root = document.getElementById('root');
  if (root) root.remove();

  let main = document.createElement('div');
  main.id = 'preview-root';
  main.innerHTML =
    '<aside class="bar" aria-label="Preview tools">' +
    '  <div class="brand">AlphaFit AI<small>Browser preview, dev only</small></div>' +
    '  <div class="group"><span class="label" id="theme-l">Theme</span>' +
    '    <div class="seg" role="group" aria-labelledby="theme-l">' +
    '      <button type="button" data-theme="light">Light</button><button type="button" data-theme="dark">Dark</button></div></div>' +
    '  <div class="group"><span class="label" id="size-l">Phone size</span>' +
    '    <div class="seg" role="group" aria-labelledby="size-l">' +
    SIZES.map(function (s) {
      return '<button type="button" data-size="' + s.id + '">' + s.label + '</button>';
    }).join('') +
    '    </div></div>' +
    '  <div class="group"><span class="label">Signed in as</span><div class="who" id="who" aria-live="polite"></div>' +
    '    <button type="button" class="action" id="signout">Sign out</button></div>' +
    '  <div class="api">Api: ' +
    String(config.api).replace(/</g, '&lt;') +
    '</div>' +
    '</aside>' +
    '<div class="stage"><div class="phone" id="phone"><iframe id="app" title="AlphaFit AI app"></iframe></div></div>';
  document.body.appendChild(main);

  let frame = document.getElementById('app');
  let phone = document.getElementById('phone');
  frame.src = start;

  function controls() {
    try {
      return frame.contentWindow && frame.contentWindow.__alphafitPreview;
    } catch {
      return null;
    }
  }

  function layout() {
    let s = state.size;
    frame.style.width = s.w + 'px';
    frame.style.height = s.h + 'px';
    let available = window.innerHeight - 48;
    let scale = Math.min(1, available / (s.h + 2 * BEZEL));
    phone.style.transform = scale < 1 ? 'scale(' + scale.toFixed(3) + ')' : '';
    let stage = phone.parentNode;
    stage.style.height = Math.round((s.h + 2 * BEZEL) * scale) + 'px';
    stage.style.width = Math.round((s.w + 2 * BEZEL) * scale) + 'px';
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render() {
    let buttons = main.querySelectorAll('[data-theme]');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        'aria-pressed',
        String(buttons[i].getAttribute('data-theme') === state.theme)
      );
    }
    let sizes = main.querySelectorAll('[data-size]');
    for (let j = 0; j < sizes.length; j++) {
      sizes[j].setAttribute(
        'aria-pressed',
        String(sizes[j].getAttribute('data-size') === state.size.id)
      );
    }
    let who = document.getElementById('who');
    let signedIn = state.status === 'ready' || state.status === 'onboarding';
    if (signedIn) {
      who.innerHTML =
        '<strong>' +
        escapeHtml(state.name || 'Signed in') +
        '</strong>' +
        escapeHtml(state.email || '');
    } else if (state.status === 'loading') {
      who.textContent = 'Starting…';
    } else {
      who.innerHTML =
        '<strong>Not signed in</strong>Get a sign-in link: run' +
        (config.tokenHints || [])
          .map(function (h) {
            return '<code>' + escapeHtml(h) + '</code>';
          })
          .join('') +
        'and open the link it prints.';
    }
    document.getElementById('signout').disabled = !signedIn;
    layout();
  }

  main.addEventListener('click', function (event) {
    let target = event.target;
    if (!(target instanceof HTMLElement)) return;
    let theme = target.getAttribute('data-theme');
    if (theme) {
      let c = controls();
      if (c) c.setTheme(theme);
      return;
    }
    let size = target.getAttribute('data-size');
    if (size) {
      for (let i = 0; i < SIZES.length; i++) if (SIZES[i].id === size) state.size = SIZES[i];
      try {
        localStorage.setItem(SIZE_KEY, size);
      } catch {
        /* storage blocked */
      }
      render();
      return;
    }
    if (target.id === 'signout') {
      let ctl = controls();
      if (ctl) ctl.signOut();
    }
  });

  // What the app reports (src/preview/PreviewBridge.tsx).
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin) return;
    let data = event.data;
    if (!data || data.source !== 'alphafit-preview') return;
    state.theme = data.theme;
    state.status = data.status;
    state.name = data.name;
    state.email = data.email;
    render();
  });

  // Keep the address bar on the app's current screen, so a reload comes back to it.
  setInterval(function () {
    try {
      let inner = frame.contentWindow.location;
      let path = inner.pathname + inner.search;
      if (path && path !== location.pathname + location.search) {
        history.replaceState(history.state, '', path);
      }
    } catch {
      /* the frame is still loading */
    }
  }, 700);

  // A window made narrow shows the app on its own, at full size.
  let timer;
  window.addEventListener('resize', function () {
    layout();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (window.innerWidth < 900 || window.innerHeight < 600) location.reload();
    }, 400);
  });

  render();
})();
