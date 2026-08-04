import { describe, expect, it } from 'vitest';
import { cellCenter, cellSize, formatCoord } from '../../src/render/coords.js';

describe('coords', () => {
  it('cellSize(order) is 100 / order', () => {
    expect(cellSize(3)).toBeCloseTo(33.333, 2);
    expect(cellSize(9)).toBeCloseTo(11.111, 2);
  });

  it('cellCenter(1,1,3) centers at 50,50', () => {
    const { x, y } = cellCenter(1, 1, 3);
    expect(x).toBe(50);
    expect(y).toBe(50);
  });

  it('cellCenter(0,0,3) centers at approximately 16.667,16.667', () => {
    const { x, y } = cellCenter(0, 0, 3);
    expect(x).toBeCloseTo(16.667, 2);
    expect(y).toBeCloseTo(16.667, 2);
  });

  it('is stable — the same call twice returns identical values', () => {
    const a = cellCenter(2, 1, 3);
    const b = cellCenter(2, 1, 3);
    expect(a).toEqual(b);
  });

  it('formatCoord output is a stable string across repeated calls', () => {
    const { x } = cellCenter(1, 1, 3);
    expect(formatCoord(x)).toBe(formatCoord(x));
    expect(typeof formatCoord(x)).toBe('string');
    expect(formatCoord(x)).toBe('50');
  });
});
