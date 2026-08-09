import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Skill-CLI flag parity drift guard (D-107, SKILL-03).
 *
 * Reads `skill/SKILL.md`'s flag table and `bin/sigil-spinner.js`'s
 * `parseArgs({ options: { ... } })` literal, both as TEXT, and asserts the
 * two derived sets of flag names are equal in BOTH directions: a flag the
 * skill documents that the CLI does not have fails, and a CLI option the
 * skill omits also fails. Neither side is ever restated as a transcribed
 * literal in this file — both are derived only by `parseCliOptionKeys` and
 * `parseSkillFlagTokens`, continuing the "guards are keyed, not
 * transcribed" precedent this repo has now followed five times (D-55,
 * D-61, D-65, D-97, D-107).
 *
 * `bin/sigil-spinner.js` is read with `readFileSync` and NEVER imported.
 * The module reads `process.argv` and calls `parseArgs` at load time, and
 * its `catch` branch calls `diagnose()`, which writes to stderr and calls
 * `process.exit` — importing it into this test process would evaluate that
 * `parseArgs` call against the test runner's own argv and could terminate
 * the run. This is the same class of import-time side effect that forced
 * `test/element-docs.test.js` to text-parse
 * `src/element/sigil-spinner-element.js` rather than import it (a bare
 * `class extends HTMLElement` throws under plain Node), and the same
 * methodology `test/citations.test.js` already applies to `.js` sources
 * throughout this repo.
 *
 * `bin/sigil-spinner.js`'s `options: { ... }` object is a NESTED
 * multi-line literal (every entry is itself a brace-delimited value),
 * unlike `test/element-docs.test.js`'s flat `observedAttributes` array —
 * so this file adapts that template's methodology rather than copying its
 * regex: `parseCliOptionKeys` counts braces to find the block boundary and
 * splits entries at depth-zero commas, which stays correct across a
 * Prettier reformat that collapses two short entries onto one line, or a
 * future option whose default spans multiple lines. A flat per-line regex
 * would work today (every option currently occupies one line) but is one
 * reformat away from silently undercounting with no error — exactly the
 * failure mode the zero-match guard below exists to catch, except a
 * partial undercount slips past a zero-match check entirely, which is why
 * the extraction itself must be format-insensitive rather than merely
 * checked after the fact.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const cliSource = readFileSync(path.join(REPO_ROOT, 'bin/sigil-spinner.js'), 'utf-8');
const skillSource = readFileSync(path.join(REPO_ROOT, 'skill/SKILL.md'), 'utf-8');

/**
 * D-108: the explicit, commented, deliberately empty allowlist for CLI
 * options that are genuinely irrelevant to the skill. It is empty as a
 * FACT about the current state (all seven current options — `planet`,
 * `json`, `output`, `glyph`, `curve`, `id-prefix`, `title` — are
 * documented in `skill/SKILL.md`'s flag table), not as a design absence.
 * Any future entry requires a written reason string beside it. The point
 * of an empty-but-present allowlist, rather than no allowlist at all, is
 * that omitting a flag from the skill becomes a deliberate edit with a
 * stated reason instead of letting this check quietly degrade into
 * one-directional the first time someone finds the reverse direction
 * inconvenient. Its subtraction below is proven to have real effect by
 * the soundness block's "allowlist has effect" test — an empty array
 * alone would prove nothing about the wiring around it.
 * @type {{ key: string, reason: string }[]}
 */
const INTENTIONALLY_UNDOCUMENTED = [];

/**
 * Subtract `INTENTIONALLY_UNDOCUMENTED`'s keys from a CLI key set. Factored
 * out so the soundness block below can prove the allowlist has real effect
 * by mutating the module-level array directly (push/pop) and calling this
 * same function, rather than re-deriving an equivalent computation that
 * could silently drift from what the main test actually runs.
 * @param {Set<string>} cliKeys
 * @returns {Set<string>}
 */
function subtractAllowlist(cliKeys) {
  const undocumentedKeys = new Set(INTENTIONALLY_UNDOCUMENTED.map((e) => e.key));
  return new Set([...cliKeys].filter((k) => !undocumentedKeys.has(k)));
}

/**
 * Extract the top-level key names from the `options: { ... }` object
 * literal inside `bin/sigil-spinner.js`'s `parseArgs({ ... })` call, by
 * brace-counting rather than a line-shape assumption. See this file's
 * header comment for why a flat per-line regex is insufficient here.
 * @param {string} source
 * @returns {Set<string>}
 */
function parseCliOptionKeys(source) {
  const startMatch = source.match(/options:\s*\{/);
  if (!startMatch) {
    throw new Error('could not find an `options: {` literal in bin/sigil-spinner.js');
  }
  const blockStart = (startMatch.index ?? 0) + startMatch[0].length; // just past the opening `{`

  let depth = 1;
  let i = blockStart;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
  }
  if (depth !== 0) {
    throw new Error('unterminated `options: { ... }` block in bin/sigil-spinner.js');
  }
  const blockInterior = source.slice(blockStart, i - 1);

  // Split the interior at depth-zero commas, then extract each entry's
  // leading key — either a bare identifier (`planet`) or a single-quoted
  // one (`'id-prefix'`, needed because that key is hyphenated).
  const keys = new Set();
  let entryDepth = 0;
  let entryStart = 0;
  for (let j = 0; j <= blockInterior.length; j++) {
    const ch = blockInterior[j];
    if (ch === '{') entryDepth++;
    else if (ch === '}') entryDepth--;
    if ((ch === ',' && entryDepth === 0) || j === blockInterior.length) {
      const entry = blockInterior.slice(entryStart, j).trim();
      if (entry.length > 0) {
        const keyMatch = entry.match(/^(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/);
        if (!keyMatch) {
          throw new Error(
            `could not parse a key from an options entry in bin/sigil-spinner.js: ${JSON.stringify(entry)}`,
          );
        }
        keys.add(keyMatch[1] ?? keyMatch[2]);
      }
      entryStart = j + 1;
    }
  }
  return keys;
}

/**
 * Extract flag tokens (leading `--` stripped) from `skill/SKILL.md`'s flag
 * table. The regex is anchored to the table-row shape — line start, pipe,
 * whitespace, a backticked `--flag` token, whitespace, pipe — so a `--flag`
 * mentioned in ordinary prose elsewhere in the skill body (which plan
 * 08-03 will add, in the invocation and shell-safety sections) is never
 * counted as a documented flag.
 * @param {string} md
 * @returns {Set<string>}
 */
function parseSkillFlagTokens(md) {
  const names = new Set();
  const rowRe = /^\|\s*`--([a-z-]+)`\s*\|/gm;
  let match;
  while ((match = rowRe.exec(md)) !== null) {
    names.add(match[1]);
  }
  if (names.size === 0) {
    throw new Error('could not find any flag-table rows (`| `--flag` | ... |`) in skill/SKILL.md');
  }
  return names;
}

describe('Skill/CLI flag parity drift guard (D-107, SKILL-03)', () => {
  it('parses a non-empty flag set from both bin/sigil-spinner.js and skill/SKILL.md', () => {
    const cliKeys = parseCliOptionKeys(cliSource);
    const skillTokens = parseSkillFlagTokens(skillSource);
    expect(cliKeys.size, 'parsed zero option keys from bin/sigil-spinner.js').toBeGreaterThan(0);
    expect(skillTokens.size, 'parsed zero flag tokens from skill/SKILL.md').toBeGreaterThan(0);
  });

  it('the skill flag table matches the CLI option keys exactly, in both directions', () => {
    const cliKeys = parseCliOptionKeys(cliSource);
    const skillTokens = parseSkillFlagTokens(skillSource);
    const cliKeysAfterAllowlist = subtractAllowlist(cliKeys);

    const skillOnly = [...skillTokens].filter((name) => !cliKeysAfterAllowlist.has(name));
    const cliOnly = [...cliKeysAfterAllowlist].filter((name) => !skillTokens.has(name));

    expect(
      skillOnly,
      `skill/SKILL.md documents flag(s) the CLI does not have: ${skillOnly.join(', ')}`,
    ).toEqual([]);
    expect(
      cliOnly,
      `bin/sigil-spinner.js has option(s) undocumented in skill/SKILL.md: ${cliOnly.join(', ')}`,
    ).toEqual([]);
  });
});

describe('Skill/CLI flag parity soundness (D-109)', () => {
  it('fails loudly (named error) when the CLI source has no `options:` anchor', () => {
    expect(() => parseCliOptionKeys('parseArgs({ allowPositionals: true });')).toThrow(
      /could not find an `options: \{` literal/,
    );
  });

  it('fails loudly (named error) when an `options:` entry cannot be reduced to a key (CR-01) — e.g. an object spread', () => {
    const spreadSource = `parseArgs({
      allowPositionals: true,
      options: {
        planet: { type: 'string' },
        ...SHARED_DEFAULTS,
        json: { type: 'boolean', default: false },
      },
    });`;
    expect(() => parseCliOptionKeys(spreadSource)).toThrow(
      /could not parse a key from an options entry in bin\/sigil-spinner\.js/,
    );
  });

  it('fails loudly (named error) when the skill source has no flag-table rows', () => {
    expect(() => parseSkillFlagTokens('# Sigil\n\nNo table here.\n')).toThrow(
      /could not find any flag-table rows/,
    );
  });

  it('the skill-only difference is non-empty when the skill documents a flag the CLI does not have', () => {
    const fakeSkillMd = '| Flag | Type | Purpose |\n|------|------|---------|\n| `--nonexistent` | boolean | made up |\n';
    const cliKeys = parseCliOptionKeys(cliSource);
    const fakeTokens = parseSkillFlagTokens(fakeSkillMd);
    const skillOnly = [...fakeTokens].filter((name) => !cliKeys.has(name));
    expect(skillOnly).toEqual(['nonexistent']);
  });

  it('the CLI-only difference is non-empty when the CLI source has an extra option the skill omits', () => {
    const fakeCliSource = `parseArgs({
      allowPositionals: true,
      options: {
        planet: { type: 'string' },
        json: { type: 'boolean', default: false },
        output: { type: 'string' },
        glyph: { type: 'boolean', default: false },
        curve: { type: 'boolean', default: false },
        'id-prefix': { type: 'string' },
        title: { type: 'boolean', default: false },
        'made-up-extra': { type: 'boolean', default: false },
      },
    });`;
    const skillTokens = parseSkillFlagTokens(skillSource);
    const fakeCliKeys = parseCliOptionKeys(fakeCliSource);
    const cliOnly = [...fakeCliKeys].filter((name) => !skillTokens.has(name));
    expect(cliOnly).toEqual(['made-up-extra']);
  });

  it('the brace-counted extraction is insensitive to formatting (two entries collapsed onto one line)', () => {
    const reformattedSource = `parseArgs({
      allowPositionals: true,
      options: {
        planet: { type: 'string' }, json: { type: 'boolean', default: false },
        output: { type: 'string' },
        glyph: { type: 'boolean', default: false },
        curve: { type: 'boolean', default: false },
        'id-prefix': { type: 'string' },
        title: { type: 'boolean', default: false },
      },
    });`;
    const reformattedKeys = parseCliOptionKeys(reformattedSource);
    const liveKeys = parseCliOptionKeys(cliSource);
    expect([...reformattedKeys].sort()).toEqual([...liveKeys].sort());
  });

  it('a `--flag`-shaped token in ordinary prose (not a table row) is not counted as documented', () => {
    const proseMd = 'Some prose mentions `--fake-flag` in passing, not in a table row.\n';
    const tokens = (() => {
      try {
        return parseSkillFlagTokens(proseMd);
      } catch {
        return new Set();
      }
    })();
    expect(tokens.has('fake-flag')).toBe(false);
  });

  it('a token placed in INTENTIONALLY_UNDOCUMENTED is genuinely subtracted from the CLI side', () => {
    const cliKeys = parseCliOptionKeys(cliSource);
    expect(cliKeys.has('planet')).toBe(true);

    // Mutate the real module-level allowlist (empty at rest, per D-108) so
    // this proof exercises the exact array subtractAllowlist reads from —
    // not a re-derived stand-in that could silently drift from it.
    INTENTIONALLY_UNDOCUMENTED.push({ key: 'planet', reason: 'soundness proof only — not a real allowlist entry' });
    try {
      const afterAllowlist = subtractAllowlist(cliKeys);
      expect(afterAllowlist.has('planet')).toBe(false);
      expect(afterAllowlist.size).toBe(cliKeys.size - 1);
    } finally {
      INTENTIONALLY_UNDOCUMENTED.pop();
    }
    expect(INTENTIONALLY_UNDOCUMENTED).toEqual([]);
  });
});
