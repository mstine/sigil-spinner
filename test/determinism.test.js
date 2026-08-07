import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSigil } from '../src/index.js';

/**
 * Determinism suite (the tool's core value proposition): asserts byte
 * equality, never "ran it twice, looked the same" (PITFALLS.md "Looks Done
 * But Isn't" checklist). Every case here fails loudly on any change to
 * coordinate rounding, attribute ordering, field ordering, or accidental
 * shared mutable state.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'bin', 'sigil-spinner.js');

const STATEMENT = 'I WILL SUCCEED';
const PLANET = 'saturn';

/** Canonical seven-planet order, matching `src/data/kamea.js`'s `PLANET_ORDER` exactly. */
const PLANETS = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

describe('Determinism contract', () => {
  it('produces strictly equal svg strings across two identical calls', () => {
    const first = generateSigil(STATEMENT, PLANET);
    const second = generateSigil(STATEMENT, PLANET);
    expect(first.svg).toBe(second.svg);
  });

  it('produces strictly equal JSON.stringify(working) strings across two identical calls', () => {
    const first = generateSigil(STATEMENT, PLANET);
    const second = generateSigil(STATEMENT, PLANET);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
  });

  it('produces the same svg through the library call as through the CLI subprocess', () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    const cliOutput = execFileSync(process.execPath, [CLI_PATH, STATEMENT, '--planet', PLANET], {
      encoding: 'utf-8',
    });
    expect(cliOutput).toBe(svg);
  });

  it('returns identical results for interleaved calls as for standalone calls (no shared mutable state, INT-02)', () => {
    const STATEMENT_A = 'I WILL SUCCEED';
    const STATEMENT_B = 'MY POWER GROWS';

    const standaloneA = generateSigil(STATEMENT_A, PLANET);
    const standaloneB = generateSigil(STATEMENT_B, PLANET);

    const interleaved = [];
    for (let i = 0; i < 10; i += 1) {
      const statement = i % 2 === 0 ? STATEMENT_A : STATEMENT_B;
      interleaved.push(generateSigil(statement, PLANET));
    }

    interleaved.forEach((result, index) => {
      const expected = index % 2 === 0 ? standaloneA : standaloneB;
      expect(result.svg).toBe(expected.svg);
      expect(JSON.stringify(result.working)).toBe(JSON.stringify(expected.working));
    });
  });

  it('matches the committed worked-example SVG file snapshot', async () => {
    const { svg } = generateSigil(STATEMENT, PLANET);
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/worked-example.svg');
  });

  it('matches the committed worked-example working file snapshot', async () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    await expect(JSON.stringify(working, null, 2)).toMatchFileSnapshot(
      './__file_snapshots__/worked-example.working.json',
    );
  });
});

describe.each(PLANETS)('Determinism matrix — %s (KAMEA-02, INT-03)', (planet) => {
  it('produces strictly equal SVG and working across two calls, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(STATEMENT, planet);
    const second = generateSigil(STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    // Snapshot assertion uses the test-context `expect` (not the imported
    // module-level `expect`) so the snapshot resolves against this specific
    // parameterized case rather than a shared inline-snapshot slot.
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-${planet}.svg`);
  });
});

/**
 * A second seven-planet matrix, this one repeat-carrying (IN-04): the
 * "I WILL SUCCEED" matrix above encodes to digits 5,3,1,3,4 — zero
 * consecutive repeats — so none of its seven committed snapshots ever
 * contains a `sigil-loop`, and loop geometry scales with `cellSize`, so a
 * regression on the tightest kamea (9x9 moon) would sail through untouched.
 * "BKT RISES" keeps B, K, T, R, S, encoding to digits 2, 2, 2, 9, 1 on every
 * planet — the digit sequence is planet-independent, so all seven get the
 * same repeat structure with different cell geometry. One statement
 * exercises three things at once: a run of three (two nested loops, D-18),
 * a run whose cell coincides with the start cell (the boundary radius step,
 * D-19), and the second link of the direction fallback chain (no segment
 * enters the run's first point, so the outgoing segment supplies travel).
 */
const REPEAT_STATEMENT = 'BKT RISES';

describe.each(PLANETS)('Determinism matrix — repeat-carrying — %s (KAMEA-02, INT-03, IN-04)', (planet) => {
  it('produces strictly equal SVG across two calls, carries two sigil-loop elements, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(REPEAT_STATEMENT, planet);
    const second = generateSigil(REPEAT_STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
    // Assert loop emission directly, not only via snapshot diff, so a future
    // change that silently drops loop emission fails on an assertion a
    // reviewer might otherwise re-record away.
    expect(first.svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(2);
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-repeat-${planet}.svg`);
  });
});

/**
 * A third seven-planet matrix, this one exercising the Latin stroke/bar
 * fold-classification amendment (CONS-04, D-23 amendment, plan 02-04 Task
 * 3): "ŁĐĦŦ" keeps L, D, H, T on every planet — four distinct nodes, no
 * consecutive repeats — encoding to digits 3, 4, 8, 2, so the case exercises
 * fold classification cleanly without entangling loop geometry. The same
 * case also asserts the Đ/Ð confusable equality directly against generated
 * SVG, not just against `normalize`'s kept letters.
 */
const STROKE_STATEMENT = 'ŁĐĦŦ';

describe.each(PLANETS)('Determinism matrix — stroke/bar fold — %s (CONS-04, INT-03)', (planet) => {
  it('produces strictly equal SVG across two calls, matches its committed snapshot, and treats Đ/Ð as identical', async (ctx) => {
    const first = generateSigil(STROKE_STATEMENT, planet);
    const second = generateSigil(STROKE_STATEMENT, planet);
    expect(first.svg).toBe(second.svg);
    expect(first.working.lettersKept).toEqual(['L', 'D', 'H', 'T']);
    expect(first.working.numbers).toEqual([3, 4, 8, 2]);

    const confusableD = generateSigil('ĐHT', planet);
    const confusableEth = generateSigil('ÐHT', planet);
    expect(confusableD.svg).toBe(confusableEth.svg);

    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-stroke-${planet}.svg`);
  });
});

/**
 * A fourth seven-planet matrix, this one exercising the opt-in planetary
 * glyph layer (REND-04, D-36 through D-39, plan 03-01). The three matrices
 * above all render with the glyph off, so a regression in glyph geometry —
 * particularly on the tightest kamea, Moon's 9x9 — would sail through
 * untouched by any of them. Reuses the same `STATEMENT`/worked-example
 * fixture as the base matrix so this variant isolates exactly one change
 * (`glyph: true`) rather than also varying the input statement.
 */
describe.each(PLANETS)('Determinism matrix — glyph — %s (REND-04, INT-03)', (planet) => {
  it('produces strictly equal SVG and working across two calls, carries exactly one sigil-glyph element, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(STATEMENT, planet, { glyph: true });
    const second = generateSigil(STATEMENT, planet, { glyph: true });
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    // Assert glyph emission directly, not only via snapshot diff, so a
    // future change that silently drops glyph emission fails on an
    // assertion a reviewer might otherwise re-record away.
    expect(first.svg.match(/class="sigil-glyph"/g) ?? []).toHaveLength(1);
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-glyph-${planet}.svg`);
  });
});

/**
 * A fifth seven-planet matrix, this one exercising curve mode (REND-02,
 * D-28 through D-31, plan 03-03) against the ordinary "I WILL SUCCEED"
 * fixture — no consecutive repeats, so this pins ordinary curved geometry
 * (the exact-zero knot guard borrowing at both path terminals only) at all
 * seven cell sizes without also exercising a mid-path repeat.
 */
describe.each(PLANETS)('Determinism matrix — curve — %s (REND-02, INT-03)', (planet) => {
  it('produces strictly equal SVG and working across two calls, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(STATEMENT, planet, { curve: true });
    const second = generateSigil(STATEMENT, planet, { curve: true });
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-curve-${planet}.svg`);
  });
});

/**
 * A sixth seven-planet matrix, this one the repeat-carrying fixture
 * ("BKT RISES") rendered in curve mode — the only place a consecutive
 * repeat, a boundary-coinciding run, and the exact-zero knot guard are all
 * exercised together UNDER curve mode; no existing matrix covers this
 * combination. Asserts the same two-loop count the straight repeat matrix
 * asserts (D-30's marker invariance made visible in the matrix itself).
 */
describe.each(PLANETS)('Determinism matrix — curve, repeat-carrying — %s (REND-02, INT-03, D-30)', (planet) => {
  it('produces strictly equal SVG across two calls, carries two sigil-loop elements, and matches its committed snapshot', async (ctx) => {
    const first = generateSigil(REPEAT_STATEMENT, planet, { curve: true });
    const second = generateSigil(REPEAT_STATEMENT, planet, { curve: true });
    expect(first.svg).toBe(second.svg);
    expect(first.svg.match(/class="sigil-loop"/g) ?? []).toHaveLength(2);
    await ctx.expect(first.svg).toMatchFileSnapshot(`./__file_snapshots__/matrix-curve-repeat-${planet}.svg`);
  });
});

describe('Glyph-mode seven-planet distinctness (REND-04, INT-03)', () => {
  it('produces seven mutually distinct glyph-mode SVGs for the same statement across all seven planets', () => {
    const svgs = new Set(PLANETS.map((planet) => generateSigil(STATEMENT, planet, { glyph: true }).svg));
    expect(svgs.size).toBe(7);
  });
});

describe('Seven-planet distinctness and key-order stability (ROADMAP success criterion 1, INT-03)', () => {
  it('produces seven mutually distinct SVGs for the same statement across all seven planets', () => {
    const svgs = new Set(PLANETS.map((planet) => generateSigil(STATEMENT, planet).svg));
    expect(svgs.size).toBe(7);
  });

  it('produces byte-identical SVG and working for a one-kept-letter statement on the smallest and largest kameas', () => {
    for (const planet of ['saturn', 'moon']) {
      const first = generateSigil('A B', planet);
      const second = generateSigil('A B', planet);
      expect(first.svg).toBe(second.svg);
      expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
    }
  });

  it('matches the committed single-letter snapshot on saturn (smallest kamea, D-27 end-bar offset)', async () => {
    const { svg } = generateSigil('A B', 'saturn');
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/single-letter-saturn.svg');
  });

  it('matches the committed single-letter snapshot on moon (largest kamea, D-27 end-bar offset)', async () => {
    const { svg } = generateSigil('A B', 'moon');
    await expect(svg).toMatchFileSnapshot('./__file_snapshots__/single-letter-moon.svg');
  });

  it('appends the Phase 2 working keys after the unchanged Phase 1 key order', () => {
    const { working } = generateSigil(STATEMENT, PLANET);
    const keys = Object.keys(working);
    const phase1Order = [
      'statement',
      'planet',
      'kameaSet',
      'gridSize',
      'lettersKept',
      'lettersStruck',
      'letterNumbers',
      'numbers',
      'cells',
      'segments',
      'start',
      'end',
    ];
    expect(keys.slice(0, phase1Order.length)).toEqual(phase1Order);
    // 'render' (D-48) is Phase 3's own append — glyph/title landed in 03-01,
    // curve in 03-03, idPrefix in 03-04 — none of them ever moved this key.
    expect(keys.slice(phase1Order.length)).toEqual(['keptTrail', 'repeats', 'render']);
  });

  it('working.render key order is curve, glyph, idPrefix, title for every option combination (D-48)', () => {
    const combinations = [
      {},
      { curve: true },
      { glyph: true },
      { title: true },
      { idPrefix: 'sig-a' },
      { curve: true, glyph: true, title: true, idPrefix: 'sig-a' },
    ];
    for (const planet of PLANETS) {
      for (const options of combinations) {
        const { working } = generateSigil(STATEMENT, planet, options);
        expect(Object.keys(working.render)).toEqual(['curve', 'glyph', 'idPrefix', 'title']);
      }
    }
  });
});

/**
 * Success Criterion 5 (REND-06, D-43, D-44, D-45): "Multiple sigils embedded
 * on one page do not collide." Proven in both the id-free default mode
 * (nothing to collide) and the prefixed mode (caller-chosen distinct
 * prefixes produce distinct ids), plus the documented exception (same
 * prefix DOES collide, by design — edge row 14).
 */
const ID_ATTR_GLOBAL = /\sid\s*=\s*"([^"]*)"/g;

describe('Success Criterion 5 — multi-embed id safety (REND-06, D-43, D-44, D-45)', () => {
  it('two DIFFERENT sigils with no idPrefix, concatenated into one document, contain zero id attributes total', () => {
    const a = generateSigil('I WILL SUCCEED', 'saturn').svg;
    const b = generateSigil('MY POWER GROWS', 'moon').svg;
    const doc = a + b;
    expect([...doc.matchAll(ID_ATTR_GLOBAL)]).toHaveLength(0);
  });

  it('two DIFFERENT sigils with two DISTINCT idPrefix values, concatenated, contain exactly two distinct ids and zero overlap', () => {
    const a = generateSigil('I WILL SUCCEED', 'saturn', { idPrefix: 'sig-a' }).svg;
    const b = generateSigil('MY POWER GROWS', 'moon', { idPrefix: 'sig-b' }).svg;
    const doc = a + b;
    const ids = [...doc.matchAll(ID_ATTR_GLOBAL)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(new Set(ids)).toEqual(new Set(['sig-a', 'sig-b']));
  });

  it('the SAME input rendered twice with an idPrefix supplied is byte-identical (id work did not break determinism)', () => {
    const options = { idPrefix: 'same-prefix' };
    const first = generateSigil('I WILL SUCCEED', 'saturn', options);
    const second = generateSigil('I WILL SUCCEED', 'saturn', options);
    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.working)).toBe(JSON.stringify(second.working));
  });

  it('edge row 14: two DIFFERENT sigils rendered with the SAME idPrefix DO collide — documented behavior, not a defect', () => {
    // Uniqueness under identical prefixes is the caller's responsibility
    // (D-44) — the library refuses to invent a per-call unique value (a
    // hash, a counter, a timestamp) because that would break the
    // byte-determinism contract every other test in this file relies on.
    // This test exists so nobody "fixes" the collision later without
    // realizing it's the documented, intentional trade-off.
    const options = { idPrefix: 'shared' };
    const a = generateSigil('I WILL SUCCEED', 'saturn', options).svg;
    const b = generateSigil('MY POWER GROWS', 'moon', options).svg;
    const doc = a + b;
    const ids = [...doc.matchAll(ID_ATTR_GLOBAL)].map((m) => m[1]);
    expect(ids).toEqual(['shared', 'shared']);
    expect(new Set(ids).size).toBe(1);
  });
});
