/**
 * Real-browser accessible-name resolution guard (INT-06).
 *
 * Every other assertion in this suite about the title-plus-idPrefix wiring
 * checks the SVG *string* — that `role="img"`, `aria-labelledby`, and a
 * matching `<title id="...">` are PRESENT in the markup. That is necessary
 * and insufficient: a reference that does not resolve is present in the
 * markup and inert in the accessibility tree, exactly the way a `var()`
 * custom property can be present in the markup and inert at render time
 * (`test/browser/theming-resolution.test.js`'s own framing for G-03-1).
 *
 * This file is the only test in the suite that computes the accessible name
 * from a real browser's accessibility tree rather than from markup shape.
 * It drives a real browser engine (Playwright/Chromium), sets the generated
 * SVG as page content, and queries by ARIA role and accessible name —
 * Playwright's role-and-name locator performs the same accessible-name
 * computation algorithm a screen reader would, which is the instrument that
 * distinguishes a wired reference from a resolving one.
 *
 * Requires: `npx playwright install chromium`. This guard fails loudly
 * rather than skipping if the browser is absent — a guard that silently
 * opts out of running is the same failure class it exists to catch.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { generateSigil } from '../../src/index.js';

/** @type {import('playwright').Browser} */
let browser;
/** @type {import('playwright').Page} */
let page;

beforeAll(async () => {
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      'Chromium is not installed — the accessible-name resolution guard cannot run.\n' +
        'Install it with:  npx playwright install chromium\n' +
        'This guard is not optional: it is the only test that proves aria-labelledby ' +
        'actually resolves to an accessible name rather than merely appearing in the markup.\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  page = await browser.newPage();
}, 120_000);

afterAll(async () => {
  await browser?.close();
});

const STATEMENT = 'I WILL SUCCEED';

/**
 * Render a titled sigil with the given idPrefix, set it as page content, and
 * return the count of accessibility-tree nodes matching role "img" with the
 * statement as the accessible name.
 *
 * @param {string} idPrefix
 * @returns {Promise<number>}
 */
async function accessibleImageCount(idPrefix) {
  const { svg } = generateSigil(STATEMENT, 'saturn', { title: true, idPrefix });
  await page.setContent(`<!doctype html><meta charset="utf-8">${svg}`);
  const locator = page.getByRole('img', { name: STATEMENT, exact: true });
  return locator.count();
}

describe('accessible name resolves in a real browser accessibility tree (INT-06)', () => {
  it('resolves the accessible name to the statement for a plain idPrefix', async () => {
    const count = await accessibleImageCount('sig-a');
    expect(count).toBe(1);
  }, 30_000);

  it('resolves the accessible name to the statement for an idPrefix containing XML metacharacters (INT-06 encoding edge)', async () => {
    const count = await accessibleImageCount(`a&b'c<d`);
    expect(count).toBe(1);
  }, 30_000);

  // Proven fail-first (below): a hand-corrupted SVG that drops the <title>
  // element entirely, while still carrying role="img" and aria-labelledby,
  // has NO accessible name matching the statement. This is the genuinely
  // discriminating regression the locator methodology exists to catch —
  // T-05-10's own scenario of a graphic role announced with no resolvable
  // name. (A weaker corruption was tried first and rejected during
  // implementation: merely diverging the aria-labelledby value from the
  // <title>'s own id, with the <title> element itself left intact, still
  // resolves in Chromium — SVG-AAM's native <title>-child naming is a
  // fallback that applies independently of whether aria-labelledby
  // resolves, so it is not useful as a teeth-proving corruption here. The
  // <title> element's presence and text, not the id linkage alone, is what
  // this test can prove matters.)
  it('is proven fail-first: an SVG missing its <title> element, despite still carrying role="img" and aria-labelledby, has no accessible name matching the statement', async () => {
    const { svg } = generateSigil(STATEMENT, 'saturn', { title: true, idPrefix: 'sig-a' });
    expect(svg).toContain('<title id="sig-a-title">I WILL SUCCEED</title>');
    const broken = svg.replace('<title id="sig-a-title">I WILL SUCCEED</title>', '');
    expect(broken).not.toBe(svg);
    expect(broken).toMatch(/role="img"/);
    expect(broken).toContain('aria-labelledby="sig-a-title"');
    await page.setContent(`<!doctype html><meta charset="utf-8">${broken}`);
    const locator = page.getByRole('img', { name: STATEMENT, exact: true });
    expect(await locator.count()).toBe(0);
  }, 30_000);
});
