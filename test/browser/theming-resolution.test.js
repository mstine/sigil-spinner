/**
 * Resolution-level theming guard (gap G-03-1).
 *
 * Every other theming test in this suite asserts against the SVG *string* — that
 * `var(--sigil-x, …)` is PRESENT in the markup. That is necessary and insufficient.
 * A presentation attribute whose value contains `var()` is parsed as a CSS
 * declaration rather than by the SVG attribute grammar, so the substituted value
 * must also be VALID for that CSS property. It is possible — and this is exactly
 * how G-03-1 shipped — for a property to be correctly named, correctly documented,
 * present in the markup, and completely inert at render time.
 *
 * CSS `stroke-width` and `opacity` accept a bare <number>. CSS `font-size` does
 * not: it requires a <length>. Emitting `font-size="var(--x, 13.333)"` therefore
 * dies at computed-value time and falls back to `inherit` — for the default AND
 * for every override, which is why the defect was invisible to a slider.
 *
 * This file is the only test in the suite that renders. It drives a real browser
 * engine (Playwright/Chromium) and compares COMPUTED styles, so it can distinguish
 * "the hook is in the markup" from "the hook works".
 *
 * Requires: `npx playwright install chromium`. The suite fails loudly rather than
 * skipping if the browser is absent — a guard that silently opts out of running is
 * the same failure class it exists to catch.
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
      'Chromium is not installed — the resolution-level theming guard cannot run.\n' +
        'Install it with:  npx playwright install chromium\n' +
        'This guard is not optional: it is the only test that proves a --sigil-* ' +
        'custom property actually resolves rather than merely appearing in the markup.\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  page = await browser.newPage();
}, 120_000);

afterAll(async () => {
  await browser?.close();
});

/**
 * Render a sigil into a real page and read the computed value of one CSS property
 * on one element, optionally under a custom-property override.
 *
 * @param {object} args
 * @param {string} args.selector - CSS selector for the target element inside the SVG.
 * @param {string} args.property - The CSS property to read back.
 * @param {Record<string,string>} [args.overrides] - `--sigil-*` overrides set on a wrapper.
 * @param {object} [args.options] - generateSigil options.
 * @param {string} [args.planet]
 * @returns {Promise<string>} The computed value.
 */
async function computed({ selector, property, overrides = {}, options = {}, planet = 'saturn' }) {
  const { svg } = generateSigil('LET THE OLD SHAPE GO', planet, options);
  const style = Object.entries(overrides)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  // The wrapper carries the overrides. Custom properties inherit into the SVG, which
  // is exactly how an embedding site would theme it — no markup edits.
  await page.setContent(
    `<!doctype html><meta charset="utf-8">` +
      `<div id="wrap" style="font-size:16px;${style}">${svg}</div>`,
  );
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`selector not found: ${sel}`);
      return getComputedStyle(el).getPropertyValue(prop).trim();
    },
    [selector, property],
  );
}

/**
 * The full themeable surface, expressed as what must be OBSERVABLE after render.
 * `defaultComputed` is the documented default's computed form; `override` is a
 * distinctive value whose computed form must differ from the default.
 */
const SURFACE = [
  // --- paint: CSS accepts <color>, so these were never at risk ---
  { prop: '--sigil-stroke', selector: '.sigil-path', css: 'stroke', override: 'rgb(1, 2, 3)' },
  { prop: '--sigil-marker-stroke', selector: '.sigil-start', css: 'stroke', override: 'rgb(4, 5, 6)' },
  { prop: '--sigil-node-fill', selector: '.sigil-node', css: 'fill', override: 'rgb(7, 8, 9)' },
  { prop: '--sigil-grid-stroke', selector: '.sigil-grid-lines', css: 'stroke', override: 'rgb(10, 11, 12)' },
  { prop: '--sigil-grid-number-fill', selector: '.sigil-grid-number', css: 'fill', override: 'rgb(13, 14, 15)' },
  { prop: '--sigil-glyph-fill', selector: '.sigil-glyph', css: 'fill', override: 'rgb(16, 17, 18)', options: { glyph: true } },

  // --- <number>-valued: CSS stroke-width and opacity accept bare numbers ---
  { prop: '--sigil-stroke-width', selector: '.sigil-path', css: 'stroke-width', override: '4.25' },
  { prop: '--sigil-node-opacity', selector: '.sigil-node', css: 'opacity', override: '0.5' },
  { prop: '--sigil-grid-opacity', selector: '.sigil-grid', css: 'opacity', override: '0.75' },
  { prop: '--sigil-glyph-opacity', selector: '.sigil-glyph', css: 'opacity', override: '0.25', options: { glyph: true } },
  { prop: '--sigil-grid-stroke-width', selector: '.sigil-grid-lines', css: 'stroke-width', override: '1.5' },

  // --- font-family: CSS accepts a family name ---
  { prop: '--sigil-grid-number-font', selector: '.sigil-grid-number', css: 'font-family', override: 'Georgia' },
  { prop: '--sigil-glyph-font', selector: '.sigil-glyph', css: 'font-family', override: 'Georgia', options: { glyph: true } },

  // --- <length>-valued: THIS is where G-03-1 lived. CSS font-size rejects a bare number. ---
  { prop: '--sigil-grid-number-font-size', selector: '.sigil-grid-number', css: 'font-size', override: '7' },
  { prop: '--sigil-glyph-size', selector: '.sigil-glyph', css: 'font-size', override: '11', options: { glyph: true } },
];

describe('every documented --sigil-* property actually RESOLVES in a browser (G-03-1)', () => {
  it.each(SURFACE.map((c) => [c.prop, c]))(
    '%s changes the computed style when overridden',
    async (_name, c) => {
      const base = await computed({
        selector: c.selector,
        property: c.css,
        options: c.options ?? {},
      });
      const overridden = await computed({
        selector: c.selector,
        property: c.css,
        overrides: { [c.prop]: c.override },
        options: c.options ?? {},
      });

      expect(base, `${c.prop}: computed ${c.css} should not be empty`).not.toBe('');
      expect(
        overridden,
        `${c.prop} had NO effect on computed ${c.css} (both "${base}"). ` +
          `The var() is in the markup but does not resolve — check that the substituted ` +
          `value is valid CSS for "${c.css}".`,
      ).not.toBe(base);
    },
    30_000,
  );
});

describe('documented per-planet font-size defaults are actually in effect (G-03-1)', () => {
  // The regression that made G-03-1 invisible: not only did overrides fail, the
  // documented defaults never applied either — font-size fell through to `inherit`,
  // so grid numbers rendered at the page's 16px rather than 0.4 x cellSize.
  // Saturn's cellSize is 100/3, so the default is 13.333 user units; Moon's is
  // 100/9, so 4.444. Pinning both ends catches an inherit-fallback regression that
  // a single-planet check would miss.
  const CASES = [
    { planet: 'saturn', expected: 13.333 },
    { planet: 'moon', expected: 4.444 },
  ];

  it.each(CASES.map((c) => [c.planet, c]))(
    'grid-number default font-size on %s is the documented 0.4 x cellSize, not inherited',
    async (_planet, c) => {
      const value = await computed({
        selector: '.sigil-grid-number',
        property: 'font-size',
        planet: c.planet,
      });
      const px = Number.parseFloat(value);
      expect(px, `computed font-size was "${value}"`).toBeCloseTo(c.expected, 2);
      expect(px, 'font-size fell back to the inherited 16px — the default is not in effect').not.toBeCloseTo(16, 2);
    },
    30_000,
  );

  it('glyph default font-size on saturn is the documented 0.9 x cellSize, not inherited', async () => {
    const value = await computed({
      selector: '.sigil-glyph',
      property: 'font-size',
      planet: 'saturn',
      options: { glyph: true },
    });
    const px = Number.parseFloat(value);
    expect(px, `computed font-size was "${value}"`).toBeCloseTo(30, 2);
    expect(px, 'font-size fell back to the inherited 16px').not.toBeCloseTo(16, 2);
  }, 30_000);
});
