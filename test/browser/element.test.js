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

describe('lifecycle, error contract, and multi-instance independence (D-94, plan 07-02)', () => {
  it(
    'D-90: loading the element module twice does not throw and leaves exactly one registered definition',
    async () => {
      /** @type {Error[]} */
      const pageErrors = [];
      /** @param {Error} err */
      const onPageError = (err) => pageErrors.push(err);
      page.on('pageerror', onPageError);
      try {
        await renderPage('<sigil-spinner statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>');
        await page.addScriptTag({
          url: `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`,
          type: 'module',
        });
        await page.locator('sigil-spinner .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

        expect(
          pageErrors.map((e) => e.message),
          'double-loading the module must not throw NotSupportedError',
        ).toHaveLength(0);
        expect(await page.evaluate(() => Boolean(customElements.get('sigil-spinner')))).toBe(true);
      } finally {
        page.removeListener('pageerror', onPageError);
      }
    },
    30_000,
  );

  it(
    'D-88: parsed-HTML-already-defined, deferred-upgrade, and createElement-before-append agree on final content',
    async () => {
      const statement = 'I WILL SUCCEED';
      const planet = 'saturn';
      const moduleUrl = `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`;

      // (a) The element sits in parsed HTML, but the module is ALREADY
      // defined by the time the parser creates it — upgrade runs
      // synchronously as part of parsing/insertion, not via a later
      // reaction. A fresh page keeps this run's custom-element registry
      // isolated from every other test in this file.
      const pageA = await browser.newPage();
      await pageA.setContent('<!doctype html><meta charset="utf-8">');
      await pageA.addScriptTag({ url: moduleUrl, type: 'module' });
      await pageA.setContent(
        `<!doctype html><meta charset="utf-8"><sigil-spinner id="x" statement="${statement}" planet="${planet}"></sigil-spinner>`,
      );
      await pageA.locator('#x .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const contentA = await pageA.locator('#x').evaluate((el) => el.innerHTML);
      await pageA.close();

      // (b) The element sits in parsed HTML FIRST, undefined — arguably the
      // single most common real usage: a deferred/module script loaded
      // after it runs the spec's "upgrade an element" algorithm, a
      // materially different code path from createElement.
      const pageB = await browser.newPage();
      await pageB.setContent(
        `<!doctype html><meta charset="utf-8"><sigil-spinner id="x" statement="${statement}" planet="${planet}"></sigil-spinner>`,
      );
      await pageB.addScriptTag({ url: moduleUrl, type: 'module' });
      await pageB.locator('#x .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const contentB = await pageB.locator('#x').evaluate((el) => el.innerHTML);
      await pageB.close();

      // (c) document.createElement + setAttribute for BOTH required
      // attributes, made before appendChild — isConnected is false for
      // those reactions, so the isConnected gate absorbs them and
      // connectedCallback performs the one real render.
      const pageC = await browser.newPage();
      await pageC.setContent('<!doctype html><meta charset="utf-8">');
      await pageC.addScriptTag({ url: moduleUrl, type: 'module' });
      await pageC.evaluate(
        ([s, p]) => {
          const el = document.createElement('sigil-spinner');
          el.id = 'x';
          el.setAttribute('statement', s);
          el.setAttribute('planet', p);
          document.body.appendChild(el);
        },
        [statement, planet],
      );
      await pageC.locator('#x .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const contentC = await pageC.locator('#x').evaluate((el) => el.innerHTML);
      await pageC.close();

      // Final content only — never a render-call count. Path (b) legitimately
      // renders more than once (isConnected is already true for every
      // attribute reaction fired during the upgrade), and every render reads
      // full current attribute state, so each independently produces the
      // correct output.
      expect(contentB, '(b) deferred-upgrade content must equal (a) already-defined content').toBe(contentA);
      expect(contentC, '(c) createElement content must equal (a) already-defined content').toBe(contentA);
    },
    60_000,
  );

  it(
    'setting an observed attribute to its current value re-renders and yields byte-identical innerHTML',
    async () => {
      await renderPage('<sigil-spinner id="idem" statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>');
      await page.locator('#idem .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const before = await page.locator('#idem').evaluate((el) => el.innerHTML);

      // WR-02: `after === before` alone CANNOT discriminate a genuine re-render
      // from a hypothetical future same-value short-circuit that skips rendering
      // entirely — both produce identical strings. So observe the DOM directly:
      // a MutationObserver on the host's children is an independent signal that
      // `#render()` actually re-ran. This is the discriminating half of the
      // claim; the equality below is the byte-identical half. Asserting only the
      // equality is the exact "assertion weaker than its stated claim" failure
      // mode that let both real v1.0 defects ship through a fully green suite.
      const reRendered = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const el = /** @type {HTMLElement} */ (document.getElementById('idem'));
            const observer = new MutationObserver((records) => {
              observer.disconnect();
              clearTimeout(timer);
              resolve(records.length > 0);
            });
            const timer = setTimeout(() => {
              observer.disconnect();
              resolve(false);
            }, 2000);
            observer.observe(el, { childList: true });
            el.setAttribute('planet', 'saturn');
          }),
      );
      await page.locator('#idem .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const after = await page.locator('#idem').evaluate((el) => el.innerHTML);

      expect(
        reRendered,
        'same-value setAttribute produced no childList mutation — #render() did not re-run, ' +
          'so the innerHTML equality below would pass vacuously (D-89: no diffing, no batching, no coalescing)',
      ).toBe(true);
      expect(after).toBe(before);
    },
    30_000,
  );

  it(
    'WRAP-03: changing planet after insertion re-renders to the new planet, proven against the oracle',
    async () => {
      const statement = 'I WILL SUCCEED';
      await renderPage(`<sigil-spinner id="mut" statement="${statement}" planet="saturn"></sigil-spinner>`);
      await page.locator('#mut .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      await page.evaluate(() =>
        /** @type {HTMLElement} */ (document.getElementById('mut')).setAttribute('planet', 'jupiter'),
      );
      await page.locator('#mut .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const rendered = await page.locator('#mut').evaluate((el) => el.innerHTML);
      const oracle = generateSigil(statement, 'jupiter', {}).svg;
      expect(rendered).toBe(await browserSerialize(oracle));
    },
    30_000,
  );

  it(
    'D-93: several elements co-render independently with zero id attributes anywhere in their rendered subtrees',
    async () => {
      await renderPage(
        '<sigil-spinner id="a" statement="I WILL SUCCEED" planet="saturn"></sigil-spinner>' +
          '<sigil-spinner id="b" statement="LET THE OLD SHAPE GO" planet="saturn"></sigil-spinner>' +
          '<sigil-spinner id="c" statement="LET THE OLD SHAPE GO" planet="saturn"></sigil-spinner>',
      );
      await page.locator('#a .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('#b .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('#c .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });

      const counts = await page.evaluate(() =>
        ['a', 'b', 'c'].map((id) => {
          const el = document.getElementById(id);
          if (!el) throw new Error(`element not found: ${id}`);
          return { svgCount: el.querySelectorAll('svg').length, idCount: el.querySelectorAll('[id]').length };
        }),
      );
      for (const c of counts) {
        expect(c.svgCount, 'each instance renders exactly one svg root').toBe(1);
        expect(c.idCount, 'zero id attributes anywhere in the rendered subtree — id-free by construction').toBe(0);
      }

      // b and c share statement/planet and no id-prefix — identical inputs
      // must render byte-identical output (D-93's construction claim, not
      // generated uniqueness).
      const bHtml = await page.locator('#b').evaluate((el) => el.innerHTML);
      const cHtml = await page.locator('#c').evaluate((el) => el.innerHTML);
      expect(bHtml).toBe(cHtml);

      // Mutating one instance leaves the others' content unchanged.
      const aHtmlBefore = await page.locator('#a').evaluate((el) => el.innerHTML);
      await page.evaluate(() =>
        /** @type {HTMLElement} */ (document.getElementById('a')).setAttribute('planet', 'jupiter'),
      );
      await page.locator('#a .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const aHtmlAfter = await page.locator('#a').evaluate((el) => el.innerHTML);
      expect(aHtmlAfter, 're-rendering #a must actually change its own content').not.toBe(aHtmlBefore);

      const bHtmlAfter = await page.locator('#b').evaluate((el) => el.innerHTML);
      const cHtmlAfter = await page.locator('#c').evaluate((el) => el.innerHTML);
      expect(bHtmlAfter, 're-rendering #a must not touch #b').toBe(bHtml);
      expect(cHtmlAfter, 're-rendering #a must not touch #c').toBe(cHtml);
    },
    30_000,
  );

  it(
    'D-91: an element carrying only one required attribute, or neither, stays inert until the missing one is set',
    async () => {
      /** @type {string[]} */
      const consoleErrors = [];
      /** @param {import('playwright').ConsoleMessage} msg */
      const onConsole = (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      page.on('console', onConsole);
      try {
        await renderPage(
          '<sigil-spinner id="statement-only" statement="I WILL SUCCEED"></sigil-spinner>' +
            '<sigil-spinner id="planet-only" planet="saturn"></sigil-spinner>' +
            '<sigil-spinner id="neither"></sigil-spinner>',
        );

        const states = await page.evaluate(() =>
          ['statement-only', 'planet-only', 'neither'].map((id) => {
            const el = document.getElementById(id);
            if (!el) throw new Error(`element not found: ${id}`);
            return { children: el.children.length, hasError: el.hasAttribute('data-sigil-error') };
          }),
        );
        for (const s of states) {
          expect(s.children, 'an element mid-construction has zero element children').toBe(0);
          expect(s.hasError, 'an inert element carries no data-sigil-error').toBe(false);
        }
        expect(consoleErrors, `unexpected console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);

        // Setting the missing attribute on the SAME instance renders it,
        // with no page reload.
        await page.evaluate(() =>
          /** @type {HTMLElement} */ (document.getElementById('statement-only')).setAttribute('planet', 'saturn'),
        );
        await page.locator('#statement-only .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
        expect(await page.locator('#statement-only .sigil-path').isVisible()).toBe(true);
      } finally {
        page.removeListener('console', onConsole);
      }
    },
    30_000,
  );

  it(
    'present-but-empty statement is not coerced to absent, and an absent statement is not coerced to present-but-empty',
    async () => {
      await renderPage(
        '<sigil-spinner id="present-empty" statement="" planet="saturn"></sigil-spinner>' +
          '<sigil-spinner id="absent" planet="saturn"></sigil-spinner>',
      );

      const states = await page.evaluate(() => {
        const presentEmpty = document.getElementById('present-empty');
        const absent = document.getElementById('absent');
        if (!presentEmpty || !absent) throw new Error('fixture element not found');
        return {
          presentEmptyError: presentEmpty.getAttribute('data-sigil-error'),
          absentError: absent.getAttribute('data-sigil-error'),
          absentChildren: absent.children.length,
        };
      });

      expect(
        states.presentEmptyError,
        'an empty-but-PRESENT statement is passed through to generateSigil, surfacing its own thrown code',
      ).toBe('E_MISSING_STATEMENT');
      expect(states.absentError, 'a genuinely ABSENT statement must never carry data-sigil-error').toBeNull();
      expect(states.absentChildren, 'a genuinely absent statement stays inert with zero children').toBe(0);
    },
    30_000,
  );

  it(
    'D-92: an unknown planet reflects data-sigil-error and logs the full error; setting a valid planet restores rendering',
    async () => {
      await renderPage('');
      await page.evaluate(() => {
        /** @type {unknown[][]} */
        // @ts-expect-error test-only capture hook on window
        window.__consoleErrors = [];
        const original = console.error;
        console.error = (...args) => {
          // @ts-expect-error test-only capture hook on window
          window.__consoleErrors.push(
            args.map((a) =>
              a instanceof Error
                ? { isError: true, message: a.message, code: /** @type {Error & {code?: string}} */ (a).code }
                : String(a),
            ),
          );
          original.apply(console, args);
        };
      });

      await page.evaluate(
        ([s, p]) => {
          const el = document.createElement('sigil-spinner');
          el.id = 'errored';
          el.setAttribute('statement', s);
          el.setAttribute('planet', p);
          document.body.appendChild(el);
        },
        ['I WILL SUCCEED', 'nibiru'],
      );

      const afterError = await page.evaluate(() => {
        const el = document.getElementById('errored');
        if (!el) throw new Error('element not found: errored');
        return { errorCode: el.getAttribute('data-sigil-error'), children: el.children.length };
      });
      expect(afterError.errorCode).toBe('E_UNKNOWN_PLANET');
      expect(afterError.children, 'a failed render clears the element to zero children').toBe(0);

      const consoleErrors = await page.evaluate(
        // @ts-expect-error test-only capture hook on window
        () => /** @type {unknown[][]} */ (window.__consoleErrors),
      );
      expect(consoleErrors).toHaveLength(1);
      expect(consoleErrors[0][0]).toBe('<sigil-spinner> failed to render:');
      expect(consoleErrors[0][1]).toMatchObject({ isError: true, code: 'E_UNKNOWN_PLANET' });

      // The full round trip (D-92), not only the error leg: setting a valid
      // planet afterwards removes the attribute and restores an svg child.
      await page.evaluate(() =>
        /** @type {HTMLElement} */ (document.getElementById('errored')).setAttribute('planet', 'saturn'),
      );
      await page.locator('#errored .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      const afterRecovery = await page.evaluate(() =>
        document.getElementById('errored')?.getAttribute('data-sigil-error'),
      );
      expect(afterRecovery).toBeNull();
    },
    30_000,
  );

  it(
    'D-90: a page with zero <sigil-spinner> tags loads the module without error, and a later-appended instance renders',
    async () => {
      const pageZero = await browser.newPage();
      /** @type {Error[]} */
      const pageErrors = [];
      pageZero.on('pageerror', (err) => pageErrors.push(err));
      await pageZero.setContent('<!doctype html><meta charset="utf-8">');
      await pageZero.addScriptTag({
        url: `http://127.0.0.1:${port}/src/element/sigil-spinner-element.js`,
        type: 'module',
      });
      expect(pageErrors.map((e) => e.message), 'a zero-instance page must not throw on module load').toHaveLength(0);
      expect(await pageZero.evaluate(() => Boolean(customElements.get('sigil-spinner')))).toBe(true);

      await pageZero.evaluate(
        ([s, p]) => {
          const el = document.createElement('sigil-spinner');
          el.id = 'later';
          el.setAttribute('statement', s);
          el.setAttribute('planet', p);
          document.body.appendChild(el);
        },
        ['I WILL SUCCEED', 'saturn'],
      );
      await pageZero.locator('#later .sigil-path').waitFor({ state: 'visible', timeout: 10_000 });
      expect(await pageZero.locator('#later .sigil-path').isVisible()).toBe(true);
      await pageZero.close();
    },
    30_000,
  );
});
