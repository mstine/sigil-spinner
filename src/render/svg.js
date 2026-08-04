/**
 * Render a PathModel into a self-contained, viewBox-based inline SVG string
 * (REND-01). Built entirely from template literals — no DOM, no dependency.
 *
 * Never emits an inline `style=""` attribute or a bare presentation-attribute
 * color literal (Pitfall 8) — paint attributes use `var(--sigil-*, <fallback>)`
 * references. Never emits an `id` attribute anywhere (D-05 keeps this phase
 * id-free; REND-06's collision-avoidance work is Phase 3).
 */

import { formatCoord } from './coords.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * The traced polyline layer. Returns an empty string for a PathModel with
 * fewer than two points — a single-point sigil has no line segment to trace
 * (its node/marker anatomy is added in a later plan task).
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
 * @typedef {Object} RenderOptions
 * @property {boolean} [title] - When true, embed the statement in a `<title>`
 *   element. Anatomy (nodes, start/end markers) and title handling are added
 *   by a later task in this plan — this signature is forward-compatible with
 *   that extension so `generate.js` can thread options through now.
 * @property {string} [statement] - The original intention statement, only
 *   relevant once `title` handling lands.
 */

/**
 * @param {import('../path/buildPath.js').PathModel} pathModel
 * @param {RenderOptions} [options]
 * @returns {string}
 */
// eslint-disable-next-line no-unused-vars
export function renderSvg(pathModel, options = {}) {
  const layers = [pathLayer(pathModel)].filter(Boolean).join('');
  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="0 0 100 100" class="sigil sigil--${pathModel.planet}">${layers}</svg>`;
}
