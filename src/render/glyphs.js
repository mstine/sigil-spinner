/**
 * Planetary glyph data — the Unicode astrological code point for each of the
 * ten planets (the seven classical planets plus the three trans-Saturnian
 * modern additions) (D-37).
 *
 * ============================================================================
 * SOURCE — cited code points
 * ============================================================================
 *   Saturn  — U+2644 ♄
 *   Jupiter — U+2643 ♃
 *   Mars    — U+2642 ♂
 *   Sun     — U+2609 ☉
 *   Venus   — U+2640 ♀
 *   Mercury — U+263F ☿
 *   Moon    — U+263D ☽
 *   Uranus  — U+2645 ♅
 *   Neptune — U+2646 ♆
 *   Pluto   — U+2647 ♇
 *
 * Every entry additionally carries Variation Selector-15 (U+FE0E) appended
 * immediately after the base code point. Per "Pitfall C: Two of Seven
 * Glyphs Carry Real Emoji-Presentation Risk" in
 * .planning/milestones/v1.0-phases/03-themeable-embeddable-layers/03-RESEARCH.md:
 * of the ten, only Venus (U+2640) and Mars (U+2642) carry the Unicode
 * `Emoji`
 * property at all — the three trans-Saturnian additions (U+2645, U+2646,
 * U+2647) were checked against the same Unicode emoji-data property at the
 * time they were added and carry no `Emoji` property either, so the count of
 * emoji-eligible glyphs stays at exactly two out of the (now ten) total, not
 * renumbered without recheck. All emoji-eligible entries already default to
 * TEXT presentation (neither has the `Emoji_Presentation` flag) — so
 * emitting the bare code point is already spec-safe. In practice, some
 * platforms' font-fallback chains (most notably Android/Chrome with Noto
 * Color Emoji) have been documented to render default-text-presentation
 * characters with a color-emoji glyph anyway, depending on which font in the
 * fallback stack claims coverage first. VS15 forces text presentation
 * deterministically, overriding that font-fallback race, and is a no-op on
 * the other eight glyphs (none of which were ever emoji-eligible) — so it is
 * applied uniformly to all ten rather than special-cased to just Venus/Mars.
 * This does not change the visible character D-37 cites; it only appends an
 * invisible presentation-selector code point.
 *
 * INVARIANT: no other module in this repository may contain a planetary
 * glyph code-point literal. Every consumer goes through `glyphFor` below.
 * This module lives in `src/render/`, not `src/data/` (D-37) — it is
 * presentation data, not canonical kamea data — and only `src/render/svg.js`
 * reads it. Nothing under `src/data/` and no cross-layer module (`generate.js`
 * included) may import from this file.
 */

/** Forces text (non-emoji) presentation deterministically (Pitfall C). */
const VARIATION_SELECTOR_15 = '︎';

/**
 * Planet -> two-code-point glyph string (astrological character + U+FE0E),
 * in the same order as `src/data/kamea.js`'s `PLANET_ORDER`. Frozen so the
 * closed ten-entry map cannot be mutated at runtime.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const PLANET_GLYPHS = Object.freeze({
  saturn: `♄${VARIATION_SELECTOR_15}`,
  jupiter: `♃${VARIATION_SELECTOR_15}`,
  mars: `♂${VARIATION_SELECTOR_15}`,
  sun: `☉${VARIATION_SELECTOR_15}`,
  venus: `♀${VARIATION_SELECTOR_15}`,
  mercury: `☿${VARIATION_SELECTOR_15}`,
  moon: `☽${VARIATION_SELECTOR_15}`,
  uranus: `♅${VARIATION_SELECTOR_15}`,
  neptune: `♆${VARIATION_SELECTOR_15}`,
  pluto: `♇${VARIATION_SELECTOR_15}`,
});

/**
 * Look up a planet's glyph string. Takes an already-canonicalized lowercase
 * planet key — no validation, no case-folding, no `SigilError` import. This
 * guard's precondition is guaranteed by every call site: the only caller is
 * `svg.js`'s glyph sub-renderer, which receives `pathModel.planet`, already
 * lowercased and already validated by `gridSize()` in `generate.js` before a
 * PathModel ever exists. Adding a defensive unknown-planet branch here would
 * duplicate a check that has already run upstream, and would pull `errors.js`
 * into a module that otherwise has zero dependencies.
 *
 * @param {string} planet - Canonical lowercase planet key.
 * @returns {string}
 */
export function glyphFor(planet) {
  return PLANET_GLYPHS[planet];
}
