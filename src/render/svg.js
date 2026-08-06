/**
 * Render a PathModel into a self-contained, viewBox-based inline SVG string
 * (REND-01). Built entirely from template literals — no DOM, no dependency.
 * Assembled from independent per-layer functions in one fixed order (path,
 * then nodes, then start marker, then end marker, then repeat loops) so a
 * future layer (grid, glyph — Phase 3) can be added at this seam without
 * touching existing ones.
 *
 * Never emits an inline `style=""` attribute or a bare presentation-attribute
 * color literal (Pitfall 8) — paint attributes use `var(--sigil-*, <fallback>)`
 * references. Never emits an `id` attribute anywhere (D-05 keeps this phase
 * id-free; REND-06's collision-avoidance work is Phase 3). Markers are plain
 * shape elements with semantic classes, not SVG `<marker>` defs.
 */

import { cellSize, formatCoord } from './coords.js';
import { escapeXml } from './escapeXml.js';

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

/** Fraction of a cell's side length used for a repeat-loop arc's radius (D-17). */
const LOOP_RADIUS_FRACTION = 0.09;

/** Fraction of a cell's side length used to offset a repeat loop away from the point center (D-17, D-19). */
const LOOP_OFFSET_FRACTION = 0.14;

/** Fraction of a cell's side length used to step each additional nested loop further out (D-18). */
const LOOP_NEST_STEP_FRACTION = 0.05;

/** Decimal places geometry derived from `cellSize` (marker radii/lengths) is rounded to. */
const GEOMETRY_PRECISION = 3;

/**
 * @param {number} n
 * @returns {number}
 */
function roundGeometry(n) {
  const factor = 10 ** GEOMETRY_PRECISION;
  return Math.round(n * factor) / factor;
}

/**
 * The traced polyline layer. Returns an empty string for a PathModel with
 * fewer than two points — a single-point sigil has no line segment to trace,
 * and this deliberately avoids emitting a path element with an empty
 * geometry attribute (REND-01 empty edge).
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function pathLayer(pathModel) {
  if (pathModel.points.length < 2) {
    return '';
  }

  const [first, ...rest] = pathModel.points;
  const d = [
    `M${formatCoord(first.x)},${formatCoord(first.y)}`,
    ...rest.map((point) => `L${formatCoord(point.x)},${formatCoord(point.y)}`),
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
 * orientation when the input vector has zero length (never happens here for
 * a real incoming segment, but keeps the function total).
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
    const offset = roundGeometry(cellSize(pathModel.gridSize) * LOOP_OFFSET_FRACTION);
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
 * One `<path class="sigil-loop">` per extra visit to a repeated cell (D-17,
 * D-18, D-20) — additive alongside `nodeLayer`'s per-visit circles, never a
 * replacement (Pitfall 5, D-06). Drawn as an open elliptical arc (a single
 * `A` command with the large-arc and sweep flags set) so it reads as a curl,
 * not a closed ring (D-17). Offset outward from the point along the
 * `perpendicularUnit` of the segment entering that point, reusing the same
 * zero-length fallback `endMarker` already uses for a one-point PathModel so
 * output stays deterministic.
 *
 * When a repeat event's `count` exceeds 1, each loop steps further from the
 * point center by `LOOP_NEST_STEP_FRACTION * cellSize` and grows its radius
 * by the same step, so `count` loops read as individually countable rather
 * than stacked on identical geometry (D-18). When the event's point
 * coincides with the CELL the start or end marker is drawn on — same
 * row/col, not merely the same `atPoint` index; a run's first repeated
 * digit can sit at `pathModel.start`'s cell while its `atPoint` (the run's
 * LAST index) is a later index — one extra `LOOP_OFFSET_FRACTION *
 * cellSize` of displacement is added before the nesting steps begin so the
 * loop clears the boundary marker (D-19). The boundary marker itself is
 * never suppressed to make room; only the loop's own geometry moves.
 *
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @returns {string}
 */
function loopLayer(pathModel) {
  const { points, segments, repeats, start, end } = pathModel;
  const startPoint = points[start];
  const endPoint = points[end];
  const size = cellSize(pathModel.gridSize);
  const baseRadius = size * LOOP_RADIUS_FRACTION;
  const baseOffset = size * LOOP_OFFSET_FRACTION;
  const nestStep = size * LOOP_NEST_STEP_FRACTION;

  return repeats
    .map((repeat) => {
      const point = points[repeat.atPoint];
      const incoming = segments.find((segment) => segment.to === repeat.atPoint);
      const from = incoming ? points[incoming.from] : null;
      const perp = from ? perpendicularUnit(point.x - from.x, point.y - from.y) : { x: 1, y: 0 };

      const isBoundary =
        (point.row === startPoint.row && point.col === startPoint.col) ||
        (point.row === endPoint.row && point.col === endPoint.col);
      const boundaryExtra = isBoundary ? baseOffset : 0;

      /** @type {string[]} */
      const loops = [];
      for (let i = 0; i < repeat.count; i += 1) {
        const offset = roundGeometry(baseOffset + boundaryExtra + nestStep * i);
        const radius = roundGeometry(baseRadius + nestStep * i);
        const cx = roundGeometry(point.x + perp.x * offset);
        const cy = roundGeometry(point.y + perp.y * offset);
        const x1 = roundGeometry(cx - radius);
        const y1 = cy;
        const x2 = roundGeometry(cx + radius);
        const y2 = cy;
        loops.push(
          `<path class="sigil-loop" d="M${formatCoord(x1)},${formatCoord(y1)} ` +
            `A${formatCoord(radius)},${formatCoord(radius)} 0 1,1 ${formatCoord(x2)},${formatCoord(y2)}" ` +
            `stroke="var(--sigil-marker-stroke, currentColor)" stroke-width="var(--sigil-stroke-width, 2)" fill="none" />`,
        );
      }
      return loops.join('');
    })
    .join('');
}

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} [title] - When true, embed the (XML-escaped) statement
 *   in a `<title>` element (D-16). Defaults to false/absent — the intention
 *   statement is omitted from the SVG artifact by default, honoring the
 *   release-the-intention posture of classic sigil practice.
 * @property {string} [statement] - The original intention statement, read
 *   only when `title` is true. Supplied internally by `generate.js`.
 */

/**
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} [options]
 * @returns {string}
 */
export function renderSvg(pathModel, options = {}) {
  const layers = [
    pathLayer(pathModel),
    nodeLayer(pathModel),
    startMarker(pathModel),
    endMarker(pathModel),
    loopLayer(pathModel),
  ]
    .filter(Boolean)
    .join('');

  const title = options.title ? `<title>${escapeXml(options.statement ?? '')}</title>` : '';

  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}">${title}${layers}</svg>`;
}
