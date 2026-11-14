/**
 * `npm run preview:serve` (tools/preview/serve.js) rewrites the exported index.html so a wide window
 * shows the app in a phone frame with the dev bar, and a narrow window or the frame itself runs the app.
 */
const { previewHtml } = jest.requireActual('../tools/preview/serve');

const exported = `<!DOCTYPE html><html><head><title>AlphaFit AI</title></head><body>
<div id="root"></div>
  <script src="/_expo/static/js/web/entry-abc123.js" defer></script>
</body></html>`;

it('replaces the bundle tag with a loader that still loads the same bundle', () => {
  const html = previewHtml(exported);
  expect(html).not.toContain('<script src="/_expo/static/js/web/entry-abc123.js" defer>');
  expect(html).toContain('var ENTRY = "/_expo/static/js/web/entry-abc123.js"');
  expect(html).toContain("shell.src = '/__preview/shell.js'");
  expect(html).toContain('<div id="root"></div>');
});

it('tells the page which api it talks to, and how to get a sign-in link, but no token or secret', () => {
  const html = previewHtml(exported);
  expect(html).toMatch(/window\.__ALPHAFIT_PREVIEW__ = \{"api":"http[^"]+","tokenHints":\[/);
  expect(html).toContain('demo-token.ps1');
  expect(html).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // no JWT
});

it('reloads a top-level page opened with a new sign-in link, so the token is read', () => {
  expect(previewHtml(exported)).toMatch(/hashchange[\s\S]*token=[\s\S]*location\.reload\(\)/);
});

it('fails loudly on an export it does not understand instead of serving a broken page', () => {
  expect(() => previewHtml('<html><body>no bundle</body></html>')).toThrow(/bundle <script> tag/);
});
