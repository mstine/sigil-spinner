/**
 * The `<sigil-spinner>` element's own browser guard — the tracer proof that
 * the whole spine works end to end (WRAP-01, WRAP-02): a real page loads
 * the element as plain ESM with no build step, the element reads its
 * attributes, calls `generateSigil`, writes the unmodified SVG into its own
 * light DOM, and Chromium renders a sigil with real geometry.
 *
 * D-94 owes this file nine rendering-level assertions in total, plus the
 * edge and state-coverage predicates in `07-02-PLAN.md`'s `must_haves`. The
 * first describe block below (07-01's tracer) proves exactly one: a
 * `<sigil-spinner>` carrying a real statement and planet, loaded through
 * the real module, produces a `.sigil-path` that is both reported visible
 * by Playwright and has non-zero drawn geometry. A rendered `svg` element
 * present in the DOM is not the same claim as a sigil actually on screen,
 * and that gap is exactly the defect class both shipped v1.0 defects
 * (G-02-1, G-03-1) belonged to — this is the only test in the suite that
 * can distinguish the two for the element. The second describe block
 * (plan 07-02) adds the rendering/theming/pass-through half of D-94's list:
 * byte-identity against the `generateSigil` oracle, custom-property and
 * class-selector reach, the `curve="false"` footgun, verbatim non-ASCII
 * pass-through, long-statement geometry, and the served example page's
 * module load. The lifecycle, failure, and multi-instance half is a
 * follow-on plan's job.
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
// Imported as the byte-identity ORACLE for every rendering/theming
// assertion below — never restate an expected rendered result as a literal.
import { generateSigil } from '../../src/index.js';

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

/**
 * Load a fresh page carrying `bodyHtml`, then load the element as real ESM
 * from the static server built above. Reused by every rendering/theming
 * assertion in this file so each test only ever states its own markup — no
 * second server, no second `beforeAll`.
 *
 * @param {string} bodyHtml
 */
async function renderPage(bodyHtml) {
  await page.setContent(`<!doctype html><meta charset="utf-8">${bodyHtml}`);
  await page.addScriptTag({
    url: `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`,
    type: 'module',
  });
}

/**
 * Round-trip a raw `generateSigil` output string through the SAME
 * `element.innerHTML = markup` assignment the element itself performs, then
 * read `.innerHTML` back — in a plain `<div>`, never through the custom
 * element. This is the correct "byte-identity" oracle for a browser
 * context: the HTML fragment serialization algorithm always writes an
 * explicit end tag for a non-void foreign (SVG-namespace) element, even one
 * with no children (`<path … />` in the raw string always reads back as
 * `<path …></path>`) — a normalization the platform performs regardless of
 * what wrote the markup. Comparing the element's rendered `innerHTML`
 * against this SAME round trip of the oracle proves the element adds and
 * removes nothing beyond ordinary DOM serialization; comparing against the
 * un-round-tripped raw string would fail on every run for a reason that has
 * nothing to do with the element's own correctness.
 *
 * @param {string} markup
 * @returns {Promise<string>}
 */
async function browserSerialize(markup) {
  return page.evaluate((rawMarkup) => {
    const scratch = document.createElement('div');
    scratch.innerHTML = rawMarkup;
    return scratch.innerHTML;
  }, markup);
}

/**
 * Read one CSS property's COMPUTED value off the first element matching
 * `selector` in the current page — throwing (rather than returning
 * `undefined`) if nothing matches, both for a clear test failure message
 * and so `getComputedStyle` never receives `null`.
 *
 * @param {string} selector
 * @param {string} cssProperty
 * @returns {Promise<string>}
 */
async function computedStyle(selector, cssProperty) {
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`selector not found: ${sel}`);
      return getComputedStyle(el).getPropertyValue(prop).trim();
    },
    [selector, cssProperty],
  );
}

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

describe('rendering, theming reach, and pass-through fidelity (D-94, plan 07-02)', () => {
  it(
    'D-85/D-86: rendered innerHTML is byte-identical to a direct generateSigil call',
    async () => {
      const statement = 'I WILL SUCCEED';
      const planet = 'saturn';
      const { svg } = generateSigil(statement, planet, {});

      await renderPage(`<sigil-spinner statement="${statement}" planet="${planet}"></sigil-spinner>`);
      await page.locator('sigil-spinner .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const rendered = await page.locator('sigil-spinner').evaluate((el) => el.innerHTML);
      expect(rendered).toBe(await browserSerialize(svg));
    },
    30_000,
  );

  it(
    'D-82: a --sigil-* override on an ancestor changes computed style on a rendered descendant',
    async () => {
      await renderPage(
        '<sigil-spinner id="base" statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>' +
          '<div style="--sigil-stroke: rgb(9, 9, 9)">' +
          '<sigil-spinner id="themed" statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>' +
          '</div>',
      );
      await page.locator('#base .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('#themed .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const baseStroke = await computedStyle('#base .sigil-path', 'stroke');
      const themedStroke = await computedStyle('#themed .sigil-path', 'stroke');

      expect(themedStroke).toBe('rgb(9, 9, 9)');
      expect(themedStroke).not.toBe(baseStroke);
    },
    30_000,
  );

  it(
    'D-82: a page-level .sigil-path rule authored outside the element matches its light-DOM children',
    async () => {
      await renderPage(
        '<style>#classed .sigil-path { stroke-dasharray: 4 2; }</style>' +
          '<sigil-spinner id="base" statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>' +
          '<div id="classed">' +
          '<sigil-spinner statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>' +
          '</div>',
      );
      await page.locator('#base .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('#classed .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const baseDasharray = await computedStyle('#base .sigil-path', 'stroke-dasharray');
      const classedDasharray = await computedStyle('#classed .sigil-path', 'stroke-dasharray');

      expect(classedDasharray).not.toBe(baseDasharray);
    },
    30_000,
  );

  it(
    'D-81: curve="false" still enables curves — presence, not value, decides the boolean',
    async () => {
      const statement = 'I WILL SUCCEED';
      const planet = 'saturn';
      const curveEnabledOracle = generateSigil(statement, planet, { curve: true }).svg;
      const curveDisabledOracle = generateSigil(statement, planet, { curve: false }).svg;

      await renderPage(
        `<sigil-spinner statement="${statement}" planet="${planet}" curve="false"></sigil-spinner>`,
      );
      await page.locator('sigil-spinner .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const rendered = await page.locator('sigil-spinner').evaluate((el) => el.innerHTML);
      expect(rendered, 'curve="false" must equal the curve-ENABLED oracle — the string is present').toBe(
        await browserSerialize(curveEnabledOracle),
      );
      expect(
        rendered,
        'curve="false" must NOT equal the curve-disabled oracle, or the footgun test would pass vacuously',
      ).not.toBe(await browserSerialize(curveDisabledOracle));
    },
    30_000,
  );

  it(
    'verbatim encoding: a non-ASCII statement reaches generateSigil unmodified — no trim, fold, or normalization',
    async () => {
      const statement = 'MÉLANGE ÑOCTURNE ÐISPATCH';
      const planet = 'saturn';
      const { svg } = generateSigil(statement, planet, {});

      await renderPage(`<sigil-spinner statement="${statement}" planet="${planet}"></sigil-spinner>`);
      await page.locator('sigil-spinner .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const rendered = await page.locator('sigil-spinner').evaluate((el) => el.innerHTML);
      expect(rendered).toBe(await browserSerialize(svg));
    },
    30_000,
  );

  it(
    'long statement (≥500 chars): geometry stays bounded by kamea order, not statement length',
    async () => {
      const statement = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(20);
      expect(statement.length).toBeGreaterThanOrEqual(500);
      const planet = 'saturn';

      await renderPage(`<sigil-spinner statement="${statement}" planet="${planet}"></sigil-spinner>`);
      const pathLocator = page.locator('sigil-spinner .sigil-path');
      await pathLocator.waitFor({ state: 'visible', timeout: 10_000 });

      const viewBox = await page.locator('sigil-spinner').locator('svg').getAttribute('viewBox');
      expect(viewBox).toBe('0 0 100 100');

      const box = await pathLocator.evaluate((el) => {
        const { width, height } = /** @type {SVGGraphicsElement} */ (el).getBBox();
        return { width, height };
      });
      expect(box.width, `getBBox() width was ${box.width}`).toBeGreaterThan(0);
      expect(box.height, `getBBox() height was ${box.height}`).toBeGreaterThan(0);
    },
    30_000,
  );

  it(
    'the served examples/element.html actually loads its module (strict-MIME dependency, D-94 #7)',
    async () => {
      await page.goto(`http://127.0.0.1:${port}/examples/element.html`);
      const locator = page.locator('.sigil-path').first();
      try {
        await locator.waitFor({ state: 'visible', timeout: 10_000 });
      } catch (err) {
        throw new Error(
          'examples/element.html rendered no visible .sigil-path. Check that the static server ' +
            'sends Content-Type: text/javascript for .js responses — Chromium enforces strict ' +
            'module MIME checking and silently rejects the module otherwise, leaving every ' +
            '<sigil-spinner> on the page inert with no console error of its own.\n' +
            `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      expect(await locator.isVisible()).toBe(true);
    },
    30_000,
  );
});
