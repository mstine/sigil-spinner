/**
 * The `<sigil-spinner>` element's own browser guard — the tracer proof that
 * the whole spine works end to end (WRAP-01, WRAP-02): a real page loads
 * the element as plain ESM with no build step, the element reads its
 * attributes, calls `generateSigil`, writes the unmodified SVG into its own
 * light DOM, and Chromium renders a sigil with real geometry.
 *
 * D-94 owes this file nine rendering-level assertions in total, split
 * across this plan and its follow-on. This file proves exactly one: a
 * `<sigil-spinner>` carrying a real statement and planet, loaded through
 * the real module, produces a `.sigil-path` that is both reported visible
 * by Playwright and has non-zero drawn geometry. An `<svg>` present in the
 * DOM is not the same claim as a sigil actually on screen, and that gap is
 * exactly the defect class both shipped v1.0 defects (G-02-1, G-03-1)
 * belonged to — this is the only test in the suite that can distinguish
 * the two for the element. The remaining eight assertions (class-selector
 * reach, custom-property override, double-registration, upgrade-timing
 * equivalence, attribute-mutation re-render, multi-instance zero-id, and
 * the `curve="false"` footgun) belong to the follow-on plan.
 *
 * This file also carries the one piece of harness `theming-resolution.test.js`
 * and `accessible-name.test.js` do not need: a `node:http` static file
 * server. Neither of those tests loads a module — this one must, and a
 * module's relative imports resolve against the SCRIPT's own fetch URL, not
 * the containing document's base URL. `page.setContent` with an inline
 * script, or `addScriptTag({ path })`, both resolve relative imports
 * against the document (`about:blank`) and silently fail; a `file://` page
 * is blocked outright by Chromium's module-script handling. Serving the
 * repository root over a real `http://` origin is the only approach that
 * lets the element's `../index.js` import chain resolve exactly as it
 * would from a CDN serving the package's own file tree.
 *
 * Requires: `npx playwright install chromium`. This guard fails loudly
 * rather than skipping if the browser is absent — a guard that silently
 * opts out of running is the same failure class it exists to catch.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..', '..');

/** Extension -> Content-Type map. `.js` MUST be `text/javascript`, not left
 * to guesswork: Chromium enforces strict MIME-type checking for module
 * scripts and silently rejects the load if the header is missing or wrong,
 * after which every `<sigil-spinner>` on the page stays inert with no
 * console error of its own.
 * @type {Record<string, string>}
 */
const MIME = { '.js': 'text/javascript', '.html': 'text/html' };

/**
 * Minimal static file server for loading the element module as real ESM.
 * Serves `rootDir` (the repository root, so the element's `../index.js`
 * import chain resolves correctly, mirroring how a real CDN serves a
 * package's whole file tree), resolves the joined request path and 404s
 * anything that escapes `rootDir`, and sends a permissive CORS header on
 * every response — a module `<script>` fetch is always CORS-mode
 * regardless of the `crossorigin` attribute, and the test page's own
 * document may sit at a different origin (`about:blank`) than this
 * server's `http://127.0.0.1:<port>`.
 *
 * @param {string} rootDir
 * @returns {Promise<{ server: import('node:http').Server, port: number }>}
 */
function startStaticServer(rootDir) {
  const resolvedRoot = path.resolve(rootDir) + path.sep;
  const server = createServer(async (req, res) => {
    const requestedPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const resolvedPath = path.resolve(path.join(rootDir, requestedPath));
    if (!resolvedPath.startsWith(resolvedRoot)) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const body = await readFile(resolvedPath);
      const contentType = MIME[path.extname(resolvedPath)] ?? 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolve({ server, port: address.port });
    });
  });
}

/** @type {import('playwright').Browser} */
let browser;
/** @type {import('playwright').Page} */
let page;
/** @type {import('node:http').Server} */
let server;
/** @type {number} */
let port;

beforeAll(async () => {
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      'Chromium is not installed — the <sigil-spinner> element tracer guard cannot run.\n' +
        'Install it with:  npx playwright install chromium\n' +
        'This guard is not optional: it is the only test that proves the element renders a ' +
        'visible sigil when loaded as real ESM in a browser, with no build step.\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  page = await browser.newPage();
  ({ server, port } = await startStaticServer(REPO_ROOT));
}, 120_000);

afterAll(async () => {
  await browser?.close();
  server?.close();
});

describe('<sigil-spinner> renders a visible sigil loaded as real ESM (WRAP-01, WRAP-02)', () => {
  it(
    'a real statement and planet produce a visible .sigil-path with non-zero geometry',
    async () => {
      await page.setContent(
        '<!doctype html><meta charset="utf-8">' +
          '<sigil-spinner statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>',
      );
      await page.addScriptTag({
        url: `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`,
        type: 'module',
      });

      // Playwright's own locator visibility algorithm — connected to the
      // DOM, non-empty bounding box, no display:none/visibility:hidden
      // ancestor. Waits/polls up to the timeout rather than checking once,
      // absorbing the redundant-but-correct re-renders the upgrade path
      // produces (D-88, D-89).
      const locator = page.locator('sigil-spinner .sigil-path');
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      expect(await locator.isVisible()).toBe(true);

      // Destructure into a plain object inside the page context: DOMRect's
      // width/height are prototype accessors, not own enumerable
      // properties, and Playwright's structured-clone serialization back
      // to Node drops them unless they are copied into a plain object here.
      const box = await locator.evaluate((el) => {
        const { width, height } = /** @type {SVGGraphicsElement} */ (el).getBBox();
        return { width, height };
      });
      expect(box.width, `getBBox() width was ${box.width}`).toBeGreaterThan(0);
      expect(box.height, `getBBox() height was ${box.height}`).toBeGreaterThan(0);
    },
    30_000,
  );
});
