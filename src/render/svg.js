/**
 * Render a PathModel into a self-contained, viewBox-based inline SVG string
 * (REND-01). Built entirely from template literals — no DOM, no dependency.
 * Assembled from independent per-layer functions in one fixed order (grid,
 * glyph, path, nodes, start marker, end marker, repeat loops — D-39) so a
 * future layer can be added at this seam without touching existing ones.
 * The grid layer (03-02) is always present (D-32 — no flag, hidden via
 * opacity); the glyph layer (03-01) is opt-in and contributes nothing (an
 * empty string, vanishing through `.filter(Boolean)`) unless `options.glyph`
 * is true.
 *
 * Never emits an inline `style=''` attribute or a bare presentation-attribute
 * color literal ("Pitfall 8: CSS-Styleability Killed by Inline `style`
 * Attributes" in .planning/milestones/v1.0-research/PITFALLS.md) — paint
 * attributes use `var(--sigil-*, <fallback>)` references. The SVG is
 * id-free BY CONSTRUCTION (D-43) — the ONLY route to
 * an emitted `id` attribute anywhere in the output is a caller-supplied
 * `options.idPrefix`, which names the root element and is routed through
 * `escapeXml` before emission (D-44), the first and only caller-controlled
 * string this project ever emits into SVG markup outside `<title>`. This
 * library deliberately does NOT derive an id from a hash of the inputs:
 * determinism means identical inputs produce identical bytes, so a hash of
 * two identical sigils on one page would produce identical ids — the exact
 * collision such a hash would claim to prevent. Uniqueness under a
 * caller-supplied prefix is the caller's responsibility. D-05 chose plain
 * shape elements over SVG `<marker>` defs specifically so no INTERNAL id was
 * ever needed, independent of `idPrefix`.
 *
 * This module (`src/render/`) must NEVER import `src/data/kamea.js` directly
 * (D-35, "Internal Boundaries" in
 * .planning/milestones/v1.0-research/ARCHITECTURE.md) — `generate.js` is the only
 * cross-layer importer. The grid layer's magic-square matrix arrives through
 * `options.kamea`, an internally-supplied render-option key `generate.js`
 * computes and spreads LAST into the options object, so a caller cannot
 * substitute a different square than the one the sigil was actually traced
 * on (T-03-06).
 */

import { cellCenter, cellSize, formatCoord, roundGeometry } from './coords.js';
import { curvedPathD } from './curve.js';
import { escapeXml } from './escapeXml.js';
import { glyphFor } from './glyphs.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Fraction of a cell's side length used for the (hidden-by-default) node
 * radius. Derived from `cellSize`, never a hardcoded unit constant, so
 * marker geometry stays consistent across all seven kamea orders (D-07).
 */
const NODE_RADIUS_FRACTION = 0.06;

/** Fraction of a cell's side length used for the start-marker circle's radius. */
const START_RADIUS_FRACTION = 0.1;

/** Fraction of a cell's side length used for the end-marker bar's full length. */
const END_BAR_LENGTH_FRACTION = 0.32;

/**
 * Fraction of a cell's side length used for a repeat-loop's base circle
 * radius (D-17). At stroke-width 2, a radius of `0.09 * cellSize` leaves
 * almost no visible interior on the tightest kamea (9x9 moon); `0.14` gives
 * the moon case a radius of 1.556 — outer span 3.111, interior ~1.1 units
 * after stroke, a visible hole so the marker reads as a loop rather than a
 * dot.
 */
const LOOP_RADIUS_FRACTION = 0.14;

/**
 * Fraction of a cell's side length used to displace the `sigil-end` bar's
 * center for a one-point PathModel (D-27). Deliberately its own constant,
 * independent of every loop-geometry constant — loop aesthetics are tuned
 * under D-17's discretion, and that tuning must never silently change the
 * bytes of a single-letter sigil's end-bar offset (review finding IN-03).
 * Its value (0.14) is the same number the pre-split loop-offset constant
 * used to carry, so single-letter output is byte-identical.
 */
const SINGLE_NODE_END_OFFSET_FRACTION = 0.14;

/**
 * Fraction of a cell's side length each additional nested loop's radius
 * grows by (D-18). Circles internally tangent at the shared anchor point
 * separate by `2 * step` at their far side; `0.14 * cellSize` gives 3.11
 * units of far-side separation on the tightest kamea (9x9 moon) — 1.1 units
 * of clear gap after stroke-width 2 — so nested loops stay individually
 * countable at every kamea order. Equivalent to "each extra loop adds one
 * base radius."
 */
const LOOP_NEST_STEP_FRACTION = 0.14;

/**
 * Fraction of a cell's side length added to every loop's radius when its
 * repeat event's cell coincides with the sigil's start or end cell (D-19).
 * Deliberately much smaller than `LOOP_NEST_STEP_FRACTION` so a
 * boundary-bumped single loop can never be mistaken for the outer loop of a
 * nested pair — one modest bump so the loop reads apart from the boundary
 * marker, nothing more.
 */
const LOOP_BOUNDARY_STEP_FRACTION = 0.04;

/**
 * Fraction of a cell's side length used as the `--sigil-glyph-size` fallback
 * (D-38, REND-04). The glyph is anchored at the fixed viewBox center
 * regardless of kamea order, but sizing it at roughly one cell keeps it
 * proportionally consistent with the traced path's own visual density — a
 * flat absolute literal would read oversized against Moon's fine 9x9 detail
 * (fallback 10) and undersized against Saturn's coarse 3x3 detail (fallback
 * 30). Verified against the fixed 0-100 viewBox: at 0.9, Saturn's widest
 * case spans roughly 35-65 on both axes, well inside the frame at every
 * order (see `GLYPH_ANCHOR`'s doc comment).
 */
const GLYPH_SIZE_FRACTION = 0.9;

/**
 * The glyph's fixed `x`/`y` anchor — the viewBox center (D-38). A literal,
 * not a `cellSize`-derived fraction, because it does not vary with kamea
 * order and because `x`/`y` are anchor coordinates, not a themeable
 * presentation surface (D-41: `var()` silently no-ops inside non-CSS-mapped
 * attributes). The documented repositioning route is a CSS `transform` on
 * `.sigil-glyph`.
 */
const GLYPH_ANCHOR = 50;

/**
 * Fraction of a cell's side length used as the `--sigil-grid-stroke-width`
 * fallback (D-33/D-40, REND-03). Lattice-line thickness stays visually
 * proportional across all seven kamea orders this way — a flat absolute
 * literal would read chunky on Moon's tight 9x9 grid (cellSize 11.111, so
 * `0.02 * cellSize` = 0.222) and hairline-thin on Saturn's coarse 3x3 grid
 * (cellSize 33.333, so 0.667) if inverted; deriving from `cellSize` keeps the
 * visual weight consistent instead of picking one order's "right" thickness.
 */
const GRID_STROKE_WIDTH_FRACTION = 0.02;

/**
 * Fraction of a cell's side length used as the `--sigil-grid-number-font-size`
 * fallback (D-34/D-40, REND-03). Verified arithmetically against the
 * tightest kamea, Moon (9x9): cellSize 11.111, so font-size lands at
 * `0.4 * 11.111` = 4.444. The largest grid-number value on any classical
 * kamea is `order^2` = 81 (two digits), and a two-digit string at this
 * font-size spans roughly 4.444 * 1.2 ~= 5.3 units of width — under 50% of
 * Moon's 11.111-wide cell, comfortable margin on all sides even at the
 * worst-case digit count and the smallest cell this renderer ever produces.
 */
const GRID_NUMBER_FONT_SIZE_FRACTION = 0.4;

/**
 * The kamea grid lattice's `d` string (D-33) — `order + 1` horizontal lines
 * plus `order + 1` vertical lines, `2 * (order + 1)` total, each boundary
 * line emitted exactly once (the outer border IS the `i = 0` and `i = order`
 * lines, never redrawn on top of them). Every line position is
 * `roundGeometry(i * cellSize(order))` — MULTIPLICATION from the index,
 * never accumulated addition (`position += cellSize` in a loop). This is not
 * stylistic: IEEE-754 floating-point addition is not perfectly associative,
 * so accumulating `cellSize(order)` `i` times can drift from `i * cellSize`
 * in the last bit before rounding, occasionally landing on a different
 * three-decimal value. For the two non-terminating cell sizes this project
 * has — Venus (100/7) and Moon (100/9) — that drift would silently break
 * byte-determinism across runs and platforms. `cellCenter` (`coords.js`)
 * already derives its coordinates via multiplication against the raw
 * `cellSize`, not accumulation; matching that convention here keeps one
 * arithmetic idiom in the codebase rather than introducing a second, subtly
 * different one.
 *
 * @param {number} order
 * @returns {string}
 */
function gridLatticeD(order) {
  const size = cellSize(order);
  /** @type {string[]} */
  const lines = [];
  for (let i = 0; i <= order; i += 1) {
    const pos = formatCoord(roundGeometry(i * size));
    lines.push(`M0,${pos} L100,${pos}`);
  }
  for (let i = 0; i <= order; i += 1) {
    const pos = formatCoord(roundGeometry(i * size));
    lines.push(`M${pos},0 L${pos},100`);
  }
  return lines.join(' ');
}

/**
 * The kamea grid layer (REND-03, D-32 through D-35) — a `<g class="sigil-grid">`
 * wrapping one lattice `<path>` and `order^2` grid-number `<text>` elements.
 * Unlike `glyphLayer`, this ALWAYS returns markup, never an empty string
 * (D-32 — the grid is unconditional, hidden via opacity, never flagged).
 *
 * Reads the magic-square matrix from `options.kamea` — an internally-supplied
 * key `generate.js` computes via `kameaGrid(canonicalPlanet)` and spreads
 * LAST into the render-options object, so a caller-supplied `kamea` key
 * cannot substitute a different square (D-35, T-03-06). This module never
 * imports `src/data/kamea.js` directly.
 *
 * Emission order, fixed by the template literals below: opening `<g>`, then
 * the lattice path, then every grid-number `<text>` in row-major order
 * (outer loop rows ascending, inner loop columns ascending — matching
 * `kameaGrid`'s row-major matrix shape), then the closing `</g>`. Grid
 * numbers are flat siblings of the lattice path, not nested in their own
 * sub-`<g>` (UI-SPEC's resolved discretion point) — there is deliberately
 * only one opacity toggle for the whole layer.
 *
 * The lattice path's `fill="none"` is LOAD-BEARING, not decorative: the `d`
 * string is M/L-only (no closed shape), and SVG defaults an unfilled path to
 * a solid black fill. Omitting this attribute would paint a filled black
 * square over the entire viewBox the instant a site raises
 * `--sigil-grid-opacity` above 0 — a defect no default-opacity-0 render can
 * ever expose, which is exactly why it must be handled here rather than
 * relied upon to surface via a default render's test coverage.
 *
 * Grid-number text content (the matrix's own digit values, 1..order^2) is
 * deliberately NOT routed through `escapeXml`: `options.kamea` always comes
 * from `kameaGrid()`'s source-verified literal matrix (`src/data/kamea.js`),
 * so every value is an integer in 1..81 whose string form is one or two
 * ASCII digits — none of the five XML-reserved characters can ever occur.
 * Running an untrusted-data escaper over a value that can never contain a
 * reserved character would falsely imply the source is caller-controlled,
 * when it is not (mirrors `glyphLayer`'s identical reasoning above).
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} options
 * @returns {string}
 */
function gridLayer(pathModel, options) {
  const order = pathModel.gridSize;
  const size = cellSize(order);
  // `RenderOptions.kamea` is typed optional because it is never a
  // caller-facing option (D-35) — but every real call path into `gridLayer`
  // is internal, via `renderSvg`, with `generate.js` always supplying it.
  // The cast documents that runtime guarantee; it is not a defensive check
  // against a genuinely reachable undefined case.
  const matrix = /** @type {number[][]} */ (options.kamea);

  const strokeWidthFallback = formatCoord(roundGeometry(size * GRID_STROKE_WIDTH_FRACTION));
  const fontSizeFallback = formatCoord(roundGeometry(size * GRID_NUMBER_FONT_SIZE_FRACTION));

  const lattice =
    `<path class="sigil-grid-lines" d="${gridLatticeD(order)}" fill="none" ` +
    `stroke="var(--sigil-grid-stroke, currentColor)" ` +
    `stroke-width="var(--sigil-grid-stroke-width, ${strokeWidthFallback})" />`;

  const numbers = matrix
    .map((row, rowIndex) =>
      row
        .map((value, colIndex) => {
          const { x, y } = cellCenter(rowIndex, colIndex, order);
          return (
            `<text class="sigil-grid-number" x="${formatCoord(x)}" y="${formatCoord(y)}" ` +
            `text-anchor="middle" dominant-baseline="central" ` +
            `fill="var(--sigil-grid-number-fill, currentColor)" ` +
            `font-size="calc(var(--sigil-grid-number-font-size, ${fontSizeFallback}) * 1px)" ` +
            `font-family="var(--sigil-grid-number-font, sans-serif)">${value}</text>`
          );
        })
        .join(''),
    )
    .join('');

  return `<g class="sigil-grid" opacity="var(--sigil-grid-opacity, 0)">${lattice}${numbers}</g>`;
}

/**
 * The optional planetary glyph layer (REND-04, D-36 through D-39) — a single
 * `<text class="sigil-glyph">` carrying the Unicode astrological character
 * for `pathModel.planet`, anchored at the fixed viewBox center regardless of
 * kamea order (D-38). Returns an empty string when `options.glyph` is
 * falsy, so the layer vanishes through `renderSvg`'s existing
 * `.filter(Boolean)` join with no branching needed at the call site — the
 * same convention `pathLayer` already uses for its sub-two-point case.
 *
 * The glyph text content, `glyphFor(pathModel.planet)`, is deliberately NOT
 * routed through `escapeXml`: none of the seven code points, nor the
 * trailing U+FE0E variation selector, is one of the five XML-reserved
 * characters, and `glyphFor` only ever returns a value drawn from a closed,
 * in-repo literal map (`src/render/glyphs.js`) — running an
 * untrusted-data escaper over a value that can never contain a reserved
 * character would falsely imply the source is caller-controlled, when it is
 * not (`test/render/glyphs.test.js` makes this a mechanical assertion).
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} options
 * @returns {string}
 */
function glyphLayer(pathModel, options) {
  if (!options.glyph) {
    return '';
  }
  const anchor = formatCoord(GLYPH_ANCHOR);
  const fallbackSize = formatCoord(roundGeometry(cellSize(pathModel.gridSize) * GLYPH_SIZE_FRACTION));
  return (
    `<text class="sigil-glyph" x="${anchor}" y="${anchor}" ` +
    `text-anchor="middle" dominant-baseline="central" ` +
    `fill="var(--sigil-glyph-fill, currentColor)" ` +
    `opacity="var(--sigil-glyph-opacity, 1)" ` +
    `font-size="calc(var(--sigil-glyph-size, ${fallbackSize}) * 1px)" ` +
    `font-family="var(--sigil-glyph-font, sans-serif)">${glyphFor(pathModel.planet)}</text>`
  );
}

/**
 * The traced polyline layer — a thin dispatcher between the straight
 * `M`-plus-`L` builder (default, byte-identical to Phase 2, D-29) and the
 * curved `curvedPathD` builder from `src/render/curve.js` (D-28), selected
 * by `options.curve`. Returns an empty string for a PathModel with fewer
 * than two points, in BOTH curve modes — a single-point sigil has no line
 * segment to trace, and this deliberately avoids emitting a path element
 * with an empty geometry attribute (REND-01 empty edge).
 *
 * D-30: curve mode changes ONLY this element's `d` attribute. Every other
 * attribute here (class, `stroke`, `stroke-width`, `fill`) is identical
 * between curve modes, and `nodeLayer`, `startMarker`, `endMarker`, and
 * `loopLayer` are never touched by this function or by `options.curve` —
 * they keep deriving their geometry from the straight-segment travel
 * vectors exactly as before, so D-05/D-17/D-18/D-19/D-27 geometry stays
 * byte-pinned in curve mode.
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} options
 * @returns {string}
 */
function pathLayer(pathModel, options) {
  if (pathModel.points.length < 2) {
    return '';
  }

  const [first] = pathModel.points;
  const d = options.curve
    ? curvedPathD(pathModel.points)
    : [
        `M${formatCoord(first.x)},${formatCoord(first.y)}`,
        ...pathModel.points.slice(1).map((point) => `L${formatCoord(point.x)},${formatCoord(point.y)}`),
      ].join(' ');

  return (
    `<path class="sigil-path" d="${d}" ` +
    `stroke="var(--sigil-stroke, currentColor)" ` +
    `stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`
  );
}

/**
 * One `circle.sigil-node` per visited cell (D-06) — a cell visited twice gets
 * two nodes, revisits stay visible in the markup, never deduplicated. Hidden
 * by default via the `--sigil-node-opacity` fallback, revealable with a
 * single CSS rule from an embedding site.
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function nodeLayer(pathModel) {
  const radius = roundGeometry(cellSize(pathModel.gridSize) * NODE_RADIUS_FRACTION);
  return pathModel.points
    .map(
      (point) =>
        `<circle class="sigil-node" cx="${formatCoord(point.x)}" cy="${formatCoord(point.y)}" ` +
        `r="${formatCoord(radius)}" fill="var(--sigil-node-fill, currentColor)" ` +
        `opacity="var(--sigil-node-opacity, 0)" />`,
    )
    .join('');
}

/**
 * Small circle carrying class `sigil-start` at the first point (D-05).
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function startMarker(pathModel) {
  const start = pathModel.points[pathModel.start];
  const radius = roundGeometry(cellSize(pathModel.gridSize) * START_RADIUS_FRACTION);
  return (
    `<circle class="sigil-start" cx="${formatCoord(start.x)}" cy="${formatCoord(start.y)}" ` +
    `r="${formatCoord(radius)}" fill="none" ` +
    `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" />`
  );
}

/**
 * Unit vector perpendicular to (dx, dy). Falls back to a fixed deterministic
 * orientation when the input vector has zero length. Every call site in this
 * module guarantees a non-degenerate (dx, dy) before calling — `endMarker`
 * only calls this for a real multi-point incoming segment, and `loopDirection`
 * checks the travel vector's magnitude before ever passing it here — so the
 * zero-length branch is a defensive fallback for a case that should not
 * occur under the current call sites, not a live code path.
 *
 * @param {number} dx
 * @param {number} dy
 * @returns {{ x: number, y: number }}
 */
function perpendicularUnit(dx, dy) {
  const magnitude = Math.hypot(dx, dy);
  if (magnitude === 0) {
    return { x: 1, y: 0 };
  }
  return { x: -dy / magnitude, y: dx / magnitude };
}

/**
 * Short bar carrying class `sigil-end` at the last point, drawn perpendicular
 * to the incoming segment (D-05). For a one-point sigil with no incoming
 * segment, uses a fixed orientation so output stays deterministic. In that
 * one-point case only (D-27), the bar's center is additionally offset away
 * from the shared start/end cell — along that same fixed orientation — so
 * the crossbar and the coincident `sigil-start` circle are both legible
 * rather than drawn on the identical center. Multi-point geometry is
 * unchanged (the offset never applies when `points.length` > 1).
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function endMarker(pathModel) {
  const { points, end } = pathModel;
  const last = points[end];
  const halfLength = roundGeometry((cellSize(pathModel.gridSize) * END_BAR_LENGTH_FRACTION) / 2);

  const perp =
    points.length >= 2 ? perpendicularUnit(last.x - points[points.length - 2].x, last.y - points[points.length - 2].y) : { x: 1, y: 0 };

  let centerX = last.x;
  let centerY = last.y;
  if (points.length === 1) {
    const offset = roundGeometry(cellSize(pathModel.gridSize) * SINGLE_NODE_END_OFFSET_FRACTION);
    centerX = roundGeometry(last.x + perp.x * offset);
    centerY = roundGeometry(last.y + perp.y * offset);
  }

  const x1 = roundGeometry(centerX - perp.x * halfLength);
  const y1 = roundGeometry(centerY - perp.y * halfLength);
  const x2 = roundGeometry(centerX + perp.x * halfLength);
  const y2 = roundGeometry(centerY + perp.y * halfLength);

  return (
    `<line class="sigil-end" x1="${formatCoord(x1)}" y1="${formatCoord(y1)}" ` +
    `x2="${formatCoord(x2)}" y2="${formatCoord(y2)}" ` +
    `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" />`
  );
}

/**
 * Resolve the unit bulge direction `u` for a repeat event's loop(s),
 * perpendicular to the run's REAL travel — never the zero-length hop
 * between two identical cells within the run itself (the dead-code cause
 * behind G-02-1/WR-01). Three-step fallback, in order:
 *
 *   1. The segment entering the run's FIRST point: the segment whose `to`
 *      equals `repeat.atPoint - repeat.count`. Travel is that point minus
 *      its `from` point.
 *   2. Otherwise the segment leaving the run's LAST point: the segment
 *      whose `from` equals `repeat.atPoint`. Travel is its `to` point minus
 *      the repeated cell's own center.
 *   3. Otherwise the fixed deterministic vector `{ x: 1, y: 0 }`, used
 *      directly as `u` — no perpendicular is taken in this branch.
 *
 * Each candidate travel vector is checked for non-zero magnitude before
 * `perpendicularUnit` is ever called on it — this function guarantees the
 * non-degenerate-input contract `perpendicularUnit` now documents — and
 * falls through to the next step if the vector is degenerate.
 *
 * When a travel vector is found (steps 1 or 2), `u = perpendicularUnit(travel)`,
 * then the centre-ward sign rule applies: if the dot product of `u` with
 * `(50 - p.x, 50 - p.y)` is negative, `u` is negated. A dot product of
 * exactly zero leaves `u` unchanged. This picks whichever of the two valid
 * perpendiculars curls toward the viewBox interior, keeping large nested
 * loops from being clipped at the frame edge — the axis still comes from
 * real travel; only the sign is chosen.
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {import('../path/buildPath.js').RepeatEvent} repeat
 * @returns {{ x: number, y: number }}
 */
function loopDirection(pathModel, repeat) {
  const { points, segments } = pathModel;
  const p = points[repeat.atPoint];

  const runFirstIndex = repeat.atPoint - repeat.count;
  const entering = segments.find((segment) => segment.to === runFirstIndex);
  if (entering) {
    const from = points[entering.from];
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    if (Math.hypot(dx, dy) !== 0) {
      return applyCentreWardSign(perpendicularUnit(dx, dy), p);
    }
  }

  const leaving = segments.find((segment) => segment.from === repeat.atPoint);
  if (leaving) {
    const to = points[leaving.to];
    const dx = to.x - p.x;
    const dy = to.y - p.y;
    if (Math.hypot(dx, dy) !== 0) {
      return applyCentreWardSign(perpendicularUnit(dx, dy), p);
    }
  }

  return { x: 1, y: 0 };
}

/**
 * Negate `u` if it points away from the viewBox center relative to `p` (dot
 * product with `(50 - p.x, 50 - p.y)` is negative). Leaves `u` unchanged on
 * an exact-zero dot product. See `loopDirection`'s doc comment for why this
 * exists — it only ever runs on a `u` derived from real travel, never on
 * the fixed fallback vector.
 *
 * @param {{ x: number, y: number }} u
 * @param {{ x: number, y: number }} p
 * @returns {{ x: number, y: number }}
 */
function applyCentreWardSign(u, p) {
  const dot = u.x * (50 - p.x) + u.y * (50 - p.y);
  return dot < 0 ? { x: -u.x, y: -u.y } : u;
}

/**
 * One `<path class="sigil-loop">` per extra visit to a repeated cell (D-17,
 * D-18, D-20) — additive alongside `nodeLayer`'s per-visit circles, never a
 * replacement ("Pitfall 5: Loop-Marker Geometry Silently Duplicating or
 * Suppressing Existing Nodes" in
 * .planning/milestones/v1.0-phases/02-every-planet-every-statement/02-RESEARCH.md,
 * D-06). Each loop is a full circle passing through
 * the repeated cell's own center `p`, drawn with the two-arc idiom
 * `M p A r,r 0 1,1 q A r,r 0 1,1 p` (two equal-radius arc commands, large-arc
 * and sweep flags both set, so the two semicircles run the same way and
 * close into one circle) — the emitted path data literally begins and ends
 * at the cell point, which is what makes the marker's connectedness
 * inspectable in the markup itself and testable without geometry math.
 * This satisfies D-17's "small loop, a circular curl at the cell" — the
 * marker IS a loop, not an open arc that merely avoids becoming one.
 *
 * The bulge direction `u` comes from `loopDirection`'s three-step real-travel
 * fallback chain with its centre-ward sign rule (see that function's doc
 * comment). The circle's implied center is `p + r*u`; the point
 * diametrically opposite `p` through that center is `q = p + 2*r*u`.
 *
 * When a repeat event's `count` exceeds 1, every loop in that event keeps
 * the identical anchor `p` and direction `u` and grows only its radius —
 * `r_i = baseRadius + boundaryStep + i * LOOP_NEST_STEP_FRACTION * cellSize`
 * for `i` from 0 to `count - 1` — so `count` loops read as individually
 * countable nested curls (D-18), never a fan sharing one endpoint. When the
 * event's point coincides with the CELL the start or end marker is drawn
 * on — same row/col, not merely the same `atPoint` index; a run's first
 * repeated digit can sit at `pathModel.start`'s cell while its `atPoint`
 * (the run's LAST index) is a later index — every loop in the run also adds
 * `LOOP_BOUNDARY_STEP_FRACTION * cellSize` to its radius so it clears the
 * boundary marker (D-19). The anchor itself never moves; only the radius
 * varies. The boundary marker is never suppressed to make room.
 *
 * Rounding: `r` is rounded once through `roundGeometry`, and `q` is computed
 * from that ROUNDED `r` (then rounded itself), so the emitted chord is
 * exactly twice the emitted radius — no drift between the two.
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function loopLayer(pathModel) {
  const { points, repeats, start, end } = pathModel;
  const startPoint = points[start];
  const endPoint = points[end];
  const size = cellSize(pathModel.gridSize);
  const baseRadius = size * LOOP_RADIUS_FRACTION;
  const boundaryStep = size * LOOP_BOUNDARY_STEP_FRACTION;
  const nestStep = size * LOOP_NEST_STEP_FRACTION;

  return repeats
    .map((repeat) => {
      const p = points[repeat.atPoint];
      const u = loopDirection(pathModel, repeat);

      const isBoundary =
        (p.row === startPoint.row && p.col === startPoint.col) ||
        (p.row === endPoint.row && p.col === endPoint.col);
      const boundaryExtra = isBoundary ? boundaryStep : 0;

      /** @type {string[]} */
      const loops = [];
      for (let i = 0; i < repeat.count; i += 1) {
        const r = roundGeometry(baseRadius + boundaryExtra + nestStep * i);
        const qx = roundGeometry(p.x + 2 * r * u.x);
        const qy = roundGeometry(p.y + 2 * r * u.y);
        loops.push(
          `<path class="sigil-loop" d="M${formatCoord(p.x)},${formatCoord(p.y)} ` +
            `A${formatCoord(r)},${formatCoord(r)} 0 1,1 ${formatCoord(qx)},${formatCoord(qy)} ` +
            `A${formatCoord(r)},${formatCoord(r)} 0 1,1 ${formatCoord(p.x)},${formatCoord(p.y)}" ` +
            `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`,
        );
      }
      return loops.join('');
    })
    .join('');
}

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [curve] - When true, `pathLayer` draws the
 *   `sigil-path` element's `d` via `curvedPathD` (hand-rolled centripetal
 *   Catmull-Rom -> cubic Bezier, D-28) instead of the default straight
 *   `M`-plus-`L` builder. Defaults to false/absent — straight segments stay
 *   byte-identical to Phase 2 output (D-29). Changes ONLY the `sigil-path`
 *   `d` attribute; every marker layer is untouched (D-30).
 * @property {boolean} [title] - When true, embed the (XML-escaped) statement
 *   in a `<title>` element (D-16). Defaults to false/absent — the intention
 *   statement is omitted from the SVG artifact by default, honoring the
 *   release-the-intention posture of classic sigil practice.
 * @property {boolean} [glyph] - When true, render the opt-in planetary
 *   glyph layer (D-36 through D-39). Defaults to false/absent — the layer
 *   contributes nothing and no `sigil-glyph` string appears anywhere in the
 *   output.
 * @property {string} [statement] - The original intention statement, read
 *   only when `title` is true. Supplied internally by `generate.js`.
 * @property {number[][]} [kamea] - The planet's magic-square matrix, read by
 *   the always-present grid layer (03-02, D-32/D-35). Supplied internally by
 *   `generate.js` via `kameaGrid(canonicalPlanet)`, spread LAST into the
 *   options object so a caller-supplied `kamea` key is always overwritten
 *   (T-03-06) — never a caller-facing option.
 * @property {string | null} [idPrefix] - When a non-empty string, names the
 *   root `<svg>` element's `id` attribute (XML-escaped) — the ONLY route to
 *   an emitted id anywhere in the output (D-43, D-44). Absent (`undefined`)
 *   or `null` emits no id attribute. Supplied by `generate.js` as the
 *   resolved option value (`null` when the caller omitted it, per D-48).
 */

/**
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} [options]
 * @returns {string}
 */
export function renderSvg(pathModel, options = {}) {
  const layers = [
    gridLayer(pathModel, options),
    glyphLayer(pathModel, options),
    pathLayer(pathModel, options),
    nodeLayer(pathModel),
    startMarker(pathModel),
    endMarker(pathModel),
    loopLayer(pathModel),
  ]
    .filter(Boolean)
    .join('');

  // idPrefix is the first and only caller-supplied string this project ever
  // emits into SVG markup (D-44) — the intention statement, the previous
  // sole untrusted input, is escaped and omitted by default (D-16). Hoisted
  // into a single boolean/escaped-value pair and computed once: the escaped
  // value now feeds TWO attribute values (the root `id` and, when a title is
  // also present, the title element's `id` and the root's `aria-labelledby`
  // reference), so escaping once and reusing keeps this module at exactly
  // two `escapeXml` invocation call sites (the title's text content, and
  // this one) rather than growing a third — `test/render/svg.test.js`
  // asserts that count. An unescaped double quote in either resulting
  // attribute value would terminate it, and everything after it would be
  // parsed as markup in whatever page embeds this SVG (T-03-16).
  const hasIdPrefix = typeof options.idPrefix === 'string' && options.idPrefix.length > 0;
  const escapedIdPrefix = hasIdPrefix ? escapeXml(/** @type {string} */ (options.idPrefix)) : '';

  // Interpolated AFTER the `class` attribute so the default (idPrefix
  // absent) byte sequence is completely untouched.
  const idAttr = hasIdPrefix ? ` id="${escapedIdPrefix}"` : '';

  // The title element's `id` is the escaped id prefix plus the literal
  // `-title` suffix — readable, deterministic, and collision-safe in
  // exactly the way the root id already is: two sigils on one page with
  // distinct prefixes get distinct title ids for free. Only derived when an
  // id prefix is present; there is nothing for `aria-labelledby` to
  // reference otherwise.
  const titleId = hasIdPrefix ? `${escapedIdPrefix}-title` : '';

  // role="img" and aria-labelledby are emitted ONLY when a title AND a
  // non-empty id prefix are both present (INT-06's own scope, D-44's
  // reasoning extended to a second attribute pair). With a title and no id
  // prefix, there is nothing for aria-labelledby to point at, and
  // announcing a graphic role with no resolvable accessible name is worse
  // than the bare <title> element it would replace — so the SVG stays a
  // bare-title-only element in that case, matching the pre-phase tree
  // byte-for-byte when idPrefix is absent.
  const hasAccessibleTitle = Boolean(options.title) && hasIdPrefix;
  const titleIdAttr = hasAccessibleTitle ? ` id="${titleId}"` : '';
  const roleAttr = hasAccessibleTitle ? ' role="img"' : '';
  const ariaLabelledByAttr = hasAccessibleTitle ? ` aria-labelledby="${titleId}"` : '';

  const title = options.title
    ? `<title${titleIdAttr}>${escapeXml(options.statement ?? '')}</title>`
    : '';

  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}"${idAttr}${roleAttr}${ariaLabelledByAttr}>${title}${layers}</svg>`;
}
