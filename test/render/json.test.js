import { describe, expect, it } from 'vitest';
import { toWorking } from '../../src/render/json.js';
import { normalize } from '../../src/text/normalize.js';
import { toPythagoreanDigit } from '../../src/data/pythagorean.js';
import { cellForNumber, gridSize, DEFAULT_KAMEA_SET } from '../../src/data/kamea.js';
import { buildPath } from '../../src/path/buildPath.js';

/**
 * Replicate the pipeline up through `buildPath` for a given statement/planet
 * and assemble the `GeneratePipelineResult` shape `toWorking` consumes — the
 * same shape `generate.js` builds, constructed here directly so this test
 * exercises `render/json.js` in isolation from the orchestrator's wiring.
 *
 * @param {string} statement
 * @param {string} planet
 * @returns {import('../../src/render/json.js').GeneratePipelineResult}
 */
function buildPipelineResult(statement, planet) {
  const { kept, struck } = normalize(statement);
  const numbers = kept.map((letter) => toPythagoreanDigit(letter));
  const order = gridSize(planet);
  const cells = numbers.map((n) => cellForNumber(planet, n));
  const path = buildPath(numbers, cells, planet, order);
  return {
    statement,
    planet: planet.toLowerCase(),
    kameaSet: DEFAULT_KAMEA_SET,
    gridSize: order,
    kept,
    struck,
    numbers,
    path,
  };
}

describe('toWorking — "I WILL SUCCEED" on Saturn (the worked example)', () => {
  const result = buildPipelineResult('I WILL SUCCEED', 'saturn');
  const working = toWorking(result);

  it('reports lettersKept joining to WLSCD and numbers [5,3,1,3,4]', () => {
    expect(working.lettersKept.join('')).toBe('WLSCD');
    expect(working.numbers).toEqual([5, 3, 1, 3, 4]);
  });

  it('reports every struck character with a non-empty reason tag', () => {
    expect(working.lettersStruck.length).toBeGreaterThan(0);
    for (const entry of working.lettersStruck) {
      expect(typeof entry.reason).toBe('string');
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('gives lettersKept, letterNumbers, numbers, and cells identical length (5)', () => {
    expect(working.lettersKept).toHaveLength(5);
    expect(working.letterNumbers).toHaveLength(5);
    expect(working.numbers).toHaveLength(5);
    expect(working.cells).toHaveLength(5);
  });

  it('pairs each kept letter with its Pythagorean digit', () => {
    expect(working.letterNumbers).toEqual([
      { letter: 'W', number: 5 },
      { letter: 'L', number: 3 },
      { letter: 'S', number: 1 },
      { letter: 'C', number: 3 },
      { letter: 'D', number: 4 },
    ]);
  });

  it('reports cells as row/col (1,1), (1,0), (2,1), (1,0), (0,0) in order', () => {
    expect(working.cells.map((cell) => [cell.row, cell.col])).toEqual([
      [1, 1],
      [1, 0],
      [2, 1],
      [1, 0],
      [0, 0],
    ]);
  });

  it("reports each cell's x and y strictly equal to the corresponding PathModel point's x and y", () => {
    working.cells.forEach((cell, index) => {
      expect(cell.x).toBe(result.path.points[index].x);
      expect(cell.y).toBe(result.path.points[index].y);
    });
  });

  it('reports kameaSet "agrippa" and gridSize 3 for saturn', () => {
    expect(working.kameaSet).toBe('agrippa');
    expect(working.gridSize).toBe(3);
  });

  it('indexes start and end at the cells the sigil-start/sigil-end markers were drawn on', () => {
    expect(working.start).toBe(result.path.start);
    expect(working.end).toBe(result.path.end);
  });

  it('survives a JSON round trip unchanged', () => {
    const roundTripped = JSON.parse(JSON.stringify(working));
    expect(roundTripped).toEqual(working);
  });

  it('produces identical JSON.stringify output for two calls with identical input', () => {
    const second = toWorking(buildPipelineResult('I WILL SUCCEED', 'saturn'));
    expect(JSON.stringify(second)).toBe(JSON.stringify(working));
  });

  it('matches the worked-example working snapshot', () => {
    expect(working).toMatchSnapshot();
  });
});
