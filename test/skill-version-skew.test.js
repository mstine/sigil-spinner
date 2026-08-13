import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Skill version-skew drift guard (SKILL-VER-GUARD-01, 260812-rfu-PLAN.md;
 * region model corrected 260813-m0x-PLAN.md at the 1.2.0 release).
 *
 * `skill/SKILL.md` carries version-shaped tokens across four regions. Only
 * ONE region is a LIVE claim that must track `package.json`'s `version` —
 * the Published-Surface Boundary opening paragraph, which states what is
 * currently published. The other THREE regions are HISTORICAL claims that
 * must stay pinned to an exact literal forever, across two independently-
 * reasoned pin sets:
 *
 *   - `HISTORICAL_PINS` (`1.1.0` / `1.0.0`) — the release at which the
 *     published `exports` map widened beyond `.`, and the earlier version
 *     a consumer may still be pinned to.
 *   - `MODERN_THREE_PINS` (`1.2.0`) — the release at which uranus, neptune
 *     and pluto became available.
 *
 * Before the 1.2.0 release, the `--planet` flag row and the Planet-list
 * skew paragraph were themselves LIVE claims: they said the modern three
 * "require a version later than 1.1.0", a forward-looking statement whose
 * truth depended on what was currently published. The 1.2.0 release
 * resolves that promise into a fact about a specific release — true at
 * 1.2.0, true at 1.3.0, true forever after — so those two regions are
 * reclassified LIVE -> HISTORICAL here, pinned to `MODERN_THREE_PINS`
 * rather than left bound to `package.json`. Leaving them LIVE would have
 * passed this release by coincidence (1.2.0 happens to be both the
 * current version and the arrival release) and then gone red at 1.3.0,
 * where the guard's own advice would have instructed a developer to
 * corrupt a correct statement about history. This is a strengthening, not
 * a weakening: both regions move from a moving target to an exact pinned
 * literal, so a find-and-replace sweep across the file is now caught in
 * three places instead of one.
 *
 * Continues the "guards are keyed, not transcribed" precedent (D-55, D-61,
 * D-65, D-97, D-107) that `test/package-identity.test.js` established: the
 * live source of truth is read from `package.json` at runtime and never
 * restated here as a literal. `HISTORICAL_PINS` and `MODERN_THREE_PINS`
 * are the two deliberate transcription exceptions in this file, each
 * commented as exactly that.
 *
 * `findHistoricalMismatches` does not accept the current version as a
 * parameter at all — the exemption is structural, not merely commented.
 * See its doc comment for why.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const packageJson = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
const skillMd = readFileSync(path.join(REPO_ROOT, 'skill/SKILL.md'), 'utf-8');

/** @type {string} */
const currentVersion = packageJson.version;

/** Shared semver-token pattern. Every scan in this file goes through this
 * single source, so the live path and the fixture path can never diverge
 * in what counts as a version token. */
const SEMVER_SOURCE = '\\d+\\.\\d+\\.\\d+';

/**
 * @typedef {'row' | 'paragraph'} RegionKind
 * @typedef {{ text: string, line: number, start: number, end: number }} Region
 * @typedef {{ id: string, anchor: string, kind: RegionKind, description: string }} LiveClaim
 * @typedef {{ version: string, reason: string }} Pin
 * @typedef {{ id: string, anchor: string, kind: RegionKind, description: string, pins: Pin[] }} HistoricalClaim
 */

/**
 * The one LIVE claim in `skill/SKILL.md` that must track `package.json`'s
 * `version`. Its anchor was verified unique against the real file at
 * planning time (260812-rfu-PLAN.md).
 * @type {LiveClaim[]}
 */
const LIVE_CLAIMS = [
  {
    id: 'published-surface-boundary',
    anchor: 'The published package resolves to version',
    kind: 'paragraph',
    description: 'the Published-Surface Boundary opening paragraph, which states the currently-published version',
  },
];

/**
 * The exports-map-widening pin set. These two version literals are facts
 * ABOUT THE PAST — the release at which the published `exports` map
 * widened beyond `.` (`1.1.0`), and the earlier version a pinned consumer
 * may still be on (`1.0.0`) — and a historical fact does not move when
 * `package.json` moves. Binding them to `package.json` would make this
 * guard demand the corruption of a correct statement about history.
 * @type {Pin[]}
 */
const HISTORICAL_PINS = [
  { version: '1.1.0', reason: "the release at which the published `exports` map widened beyond `.`" },
  { version: '1.0.0', reason: 'the earlier version a consumer may still be pinned to' },
];

/**
 * The modern-three-planets pin set. `1.2.0` is the release at which
 * uranus, neptune and pluto became available — a fact about a specific
 * release, not a moving target. Independent of `HISTORICAL_PINS`: the two
 * pin sets share the structural property of never taking `package.json`
 * as an input, but they are reasoned about separately and must not be
 * merged into one list, because a future third pin set (for some other
 * historical fact) would otherwise have no clean place to attach its own
 * reason.
 * @type {Pin[]}
 */
const MODERN_THREE_PINS = [
  { version: '1.2.0', reason: 'the release at which uranus, neptune and pluto became available' },
];

/**
 * The three HISTORICAL regions in `skill/SKILL.md`, each pinned to one of
 * the two pin sets above. Anchors were verified unique against the real
 * file at planning time (260812-rfu-PLAN.md for `exports-map-widening`,
 * 260813-m0x-PLAN.md for the other two, reclassified from LIVE at that
 * plan's release).
 * @type {HistoricalClaim[]}
 */
const HISTORICAL_CLAIMS = [
  {
    id: 'exports-map-widening',
    anchor: 'Prior to ',
    kind: 'paragraph',
    description: "the paragraph describing the `exports` map widening beyond `.`",
    pins: HISTORICAL_PINS,
  },
  {
    id: 'planet-flag-row',
    anchor: '| `--planet` |',
    kind: 'row',
    description: "the `--planet` flag-table row, which states which release the modern three planets arrived in",
    pins: MODERN_THREE_PINS,
  },
  {
    id: 'planet-list-skew',
    anchor: '**Planet-list skew.**',
    kind: 'paragraph',
    description: 'the Planet-list skew paragraph, which states which release the modern three planets arrived in',
    pins: MODERN_THREE_PINS,
  },
];

/**
 * Locate the unique occurrence of `anchor` (a plain substring, never a
 * regex) within `text` and extract the surrounding region.
 *
 * Throws a distinct, named error when the anchor is absent (the guard
 * cannot verify anything without it, and must not pass vacuously) and a
 * differently-named error when the anchor is ambiguous — two distinct
 * repairs, two distinct messages.
 * @param {string} text
 * @param {string} anchor
 * @param {RegionKind} kind
 * @returns {Region}
 */
function extractRegion(text, anchor, kind) {
  const indices = [];
  let from = 0;
  for (;;) {
    const idx = text.indexOf(anchor, from);
    if (idx === -1) break;
    indices.push(idx);
    from = idx + 1;
  }
  if (indices.length === 0) {
    throw new Error(
      `extractRegion: anchor not found in skill/SKILL.md: ${JSON.stringify(anchor)} — the surrounding prose may have been reworded; this guard cannot verify anything without a matching anchor and must not pass vacuously`,
    );
  }
  if (indices.length > 1) {
    throw new Error(
      `extractRegion: anchor is ambiguous in skill/SKILL.md (${indices.length} occurrences): ${JSON.stringify(anchor)} — expected exactly one`,
    );
  }
  const idx = indices[0];
  const line = (text.slice(0, idx).match(/\n/g) ?? []).length + 1;
  const lineStart = text.lastIndexOf('\n', idx) + 1;
  let end;
  if (kind === 'row') {
    const nextNewline = text.indexOf('\n', idx);
    end = nextNewline === -1 ? text.length : nextNewline;
  } else {
    const rest = text.slice(lineStart);
    const blankMatch = rest.match(/\n[ \t]*\n/);
    end = blankMatch && blankMatch.index !== undefined ? lineStart + blankMatch.index : text.length;
  }
  return { text: text.slice(lineStart, end), line, start: lineStart, end };
}

/**
 * Every semver-shaped token in `text`, in order.
 * @param {string} text
 * @returns {string[]}
 */
function scanSemverTokens(text) {
  return [...text.matchAll(new RegExp(SEMVER_SOURCE, 'g'))].map((m) => m[0]);
}

/**
 * Every semver-shaped token in `text`, each with its absolute character
 * index and 1-based line number within `text`.
 * @param {string} text
 * @returns {{ token: string, index: number, line: number }[]}
 */
function scanSemverTokensWithPosition(text) {
  return [...text.matchAll(new RegExp(SEMVER_SOURCE, 'g'))].map((m) => {
    const index = m.index ?? 0;
    const line = (text.slice(0, index).match(/\n/g) ?? []).length + 1;
    return { token: m[0], index, line };
  });
}

/**
 * Findings where a LIVE region's stated version(s) do not equal
 * `currentVersion`. One finding per mismatched region, naming that region.
 * @param {string} md
 * @param {string} currentVer
 * @returns {{ id: string, description: string, tokens: string[], line: number }[]}
 */
function findLiveClaimMismatches(md, currentVer) {
  const findings = [];
  for (const claim of LIVE_CLAIMS) {
    const region = extractRegion(md, claim.anchor, claim.kind);
    const tokens = scanSemverTokens(region.text);
    const mismatched = tokens.filter((t) => t !== currentVer);
    if (mismatched.length > 0) {
      findings.push({ id: claim.id, description: claim.description, tokens: mismatched, line: region.line });
    }
  }
  return findings;
}

/**
 * Findings where a HISTORICAL region's version literal(s) no longer equal
 * that region's own pinned set. Deliberately does NOT take the current
 * version as a parameter — see `HISTORICAL_PINS`/`MODERN_THREE_PINS`
 * above for why. A token in a historical region is only ever wrong when it
 * stops matching that region's own transcribed pin, never because
 * `package.json` moved. This structural exemption is load-bearing: it is
 * what lets `planet-flag-row` and `planet-list-skew` be reclassified here
 * without a version-parameter threading change anywhere else in the file.
 * @param {string} md
 * @returns {{ id: string, tokens: string[], line: number }[]}
 */
function findHistoricalMismatches(md) {
  const findings = [];
  for (const claim of HISTORICAL_CLAIMS) {
    const region = extractRegion(md, claim.anchor, claim.kind);
    const tokens = scanSemverTokens(region.text);
    const allowed = new Set(claim.pins.map((p) => p.version));
    const unexpected = tokens.filter((t) => !allowed.has(t));
    if (unexpected.length > 0) {
      findings.push({ id: claim.id, tokens: unexpected, line: region.line });
    }
  }
  return findings;
}

/**
 * Findings for semver tokens present in `md` but inside none of the four
 * known regions — so a version claim added anywhere outside them cannot go
 * unguarded.
 * @param {string} md
 * @returns {{ token: string, line: number }[]}
 */
function findCoverageGaps(md) {
  const regions = [
    ...LIVE_CLAIMS.map((c) => extractRegion(md, c.anchor, c.kind)),
    ...HISTORICAL_CLAIMS.map((c) => extractRegion(md, c.anchor, c.kind)),
  ];
  const allTokens = scanSemverTokensWithPosition(md);
  return allTokens
    .filter((t) => !regions.some((r) => t.index >= r.start && t.index < r.end))
    .map((t) => ({ token: t.token, line: t.line }));
}

/**
 * Build the live-claim test's failure message. Collect-then-report-once,
 * stably sorted by region id, per `test/citations.test.js` and
 * `test/skill-install-parity.test.js`'s failure-message discipline.
 * @param {{ id: string, description: string, tokens: string[], line: number }[]} findings
 * @param {string} currentVer
 * @returns {string}
 */
function buildLiveClaimFailureMessage(findings, currentVer) {
  const sorted = [...findings].sort((a, b) => a.id.localeCompare(b.id));
  const historicalList = HISTORICAL_CLAIMS.map((c) => `${c.id} (${JSON.stringify(c.anchor)})`).join(', ');
  const lines = [
    `package.json's version is "${currentVer}" — this is the source of truth.`,
    'The following claim(s) in skill/SKILL.md do not match it:',
    ...sorted.map((f) => `  - ${f.id} (${f.description}), line ${f.line}: currently states ${f.tokens.join(', ')}`),
    `Update those claims in skill/SKILL.md to "${currentVer}".`,
    `Do NOT touch the HISTORICAL regions — ${historicalList} — they are deliberately pinned and must be left exactly as written. A blind find-and-replace across the file will corrupt them; a separate test in this file (the historical/pinned test) guards them and will fail if any is swept.`,
    'After editing skill/SKILL.md, re-sync the installed copy: `npm run skill:install -- --force` (per scripts/skill-install.js) — otherwise this fix passes here but leaves the installed skill divergent, which test/skill-install-parity.test.js will then catch as a second, confusing failure.',
  ];
  return lines.join('\n');
}

/**
 * Build the historical-claim test's failure message, naming which region
 * drifted, which literal it now states, which pin it was supposed to
 * match, and why that pin is deliberate.
 * @param {{ id: string, tokens: string[], line: number }[]} findings
 * @returns {string}
 */
function buildHistoricalFailureMessage(findings) {
  const lines = findings.map((f) => {
    const claim = HISTORICAL_CLAIMS.find((c) => c.id === f.id);
    if (!claim) {
      throw new Error(`buildHistoricalFailureMessage: no HISTORICAL_CLAIMS entry has id ${JSON.stringify(f.id)}`);
    }
    const allowed = claim.pins.map((p) => `${p.version} (${p.reason})`).join('; ');
    return `  - ${f.id} (${claim.description}), line ${f.line}: currently states ${f.tokens.join(', ')} — expected one of: ${allowed}. This pin is deliberate — a fact about a specific past release — and must not move when package.json moves.`;
  });
  return [
    'One or more HISTORICAL regions in skill/SKILL.md no longer state their own pinned version literal(s):',
    ...lines,
  ].join('\n');
}

/**
 * The version the fixture builder's one live region (`boundaryParagraph`)
 * defaults to. Deliberately DIFFERENT from `MODERN_THREE_PINS`' `1.2.0` —
 * this fixture's stand-in for "whatever `package.json` currently says" —
 * so the fixtures can catch a bug that conflates a live token with a
 * pinned one. If both constants ever collapsed to the same literal, a bug
 * that read the wrong constant would still pass by coincidence.
 */
const FIXTURE_DEFAULT_VERSION = '1.1.0';

/**
 * A minimal synthetic document containing all four anchors, parameterised
 * by the version each region should state. Contains only the anchors plus
 * a version token — never the real file's surrounding prose, which would
 * create a second copy free to drift. If the anchors below ever diverge
 * from the real file's, the live-tree tests fail with the named
 * missing-anchor error, so the coupling is self-checking.
 * @param {{
 *   planetRow?: string,
 *   boundaryParagraph?: string,
 *   skewParagraph?: string,
 *   historicalPin1?: string,
 *   historicalPin2?: string,
 *   extraToken?: string,
 * }} [versions]
 * @returns {string}
 */
function buildFixtureMd(versions = {}) {
  const {
    planetRow = MODERN_THREE_PINS[0].version,
    boundaryParagraph = FIXTURE_DEFAULT_VERSION,
    skewParagraph = MODERN_THREE_PINS[0].version,
    historicalPin1 = HISTORICAL_PINS[0].version,
    historicalPin2 = HISTORICAL_PINS[1].version,
    extraToken = '',
  } = versions;
  const lines = [
    `| \`--planet\` | string, required | uranus, neptune and pluto arrived in ${planetRow} |`,
    '',
    `The published package resolves to version \`${boundaryParagraph}\` as of some date.`,
    '',
    `Prior to \`${historicalPin1}\` the published exports map exposed only the library entry. It still applies to anyone pinned to \`${historicalPin2}\`.`,
    '',
    `**Planet-list skew.** The classical seven are valid on every published version. Uranus, neptune and pluto arrived in ${skewParagraph}.`,
  ];
  if (extraToken.length > 0) {
    lines.push('', `An unrelated stray token, outside every region: ${extraToken}.`);
  }
  return lines.join('\n');
}

describe('Skill version-skew live-tree guard (SKILL-VER-GUARD-01)', () => {
  it('parses exactly four regions from skill/SKILL.md — one live, three historical', () => {
    const liveRegions = LIVE_CLAIMS.map((c) => extractRegion(skillMd, c.anchor, c.kind));
    const historicalRegions = HISTORICAL_CLAIMS.map((c) => extractRegion(skillMd, c.anchor, c.kind));
    expect(liveRegions.length).toBe(1);
    expect(historicalRegions.length).toBe(3);
    for (const region of historicalRegions) {
      expect(region.text.length).toBeGreaterThan(0);
    }
  });

  it("every live claim in skill/SKILL.md matches package.json's version", () => {
    const findings = findLiveClaimMismatches(skillMd, currentVersion);
    expect(findings, buildLiveClaimFailureMessage(findings, currentVersion)).toEqual([]);
  });

  it('every historical/pinned region in skill/SKILL.md states exactly its own transcribed pinned version(s)', () => {
    const findings = findHistoricalMismatches(skillMd);
    expect(findings, buildHistoricalFailureMessage(findings)).toEqual([]);
  });

  it('every semver token in skill/SKILL.md is accounted for by exactly one known region', () => {
    const gaps = findCoverageGaps(skillMd);
    expect(
      gaps,
      `token(s) found outside every known region: ${gaps.map((g) => `"${g.token}" at line ${g.line}`).join(', ')}`,
    ).toEqual([]);
  });
});

describe('Skill version-skew guard soundness (fixtures)', () => {
  it('flags a mismatched live region and produces exactly one finding, naming that region', () => {
    const md = buildFixtureMd({ boundaryParagraph: '2.0.0' });
    const findings = findLiveClaimMismatches(md, FIXTURE_DEFAULT_VERSION);
    expect(findings.length).toBe(1);
    expect(findings[0].id).toBe('published-surface-boundary');
  });

  it('produces zero live and zero historical findings when every region matches its expected version (control)', () => {
    const md = buildFixtureMd();
    expect(findLiveClaimMismatches(md, FIXTURE_DEFAULT_VERSION)).toEqual([]);
    expect(findHistoricalMismatches(md)).toEqual([]);
  });

  it('the historical checks stay green when the current version is bumped to something no region states — the exemption proof', () => {
    const bumped = '9.9.9';
    const md = buildFixtureMd({ boundaryParagraph: bumped });
    // The live region above now disagrees with the ORIGINAL fixture
    // version, simulating what a package.json bump does to the live
    // claim:
    const liveFindingsAgainstOriginal = findLiveClaimMismatches(md, FIXTURE_DEFAULT_VERSION);
    expect(liveFindingsAgainstOriginal.length).toBeGreaterThan(0);
    // All three historical regions were untouched by the bump and take no
    // version parameter at all — they must stay green regardless:
    expect(findHistoricalMismatches(md)).toEqual([]);
  });

  it("flags the exports-map-widening historical region when its own pinned version literal is altered (find-and-replace sweep detection)", () => {
    const md = buildFixtureMd({ historicalPin1: '9.9.9' });
    const findings = findHistoricalMismatches(md);
    expect(findings.length).toBe(1);
    expect(findings[0].id).toBe('exports-map-widening');
  });

  it('flags the planet-flag-row historical region when its own pinned version literal is altered (find-and-replace sweep detection)', () => {
    const md = buildFixtureMd({ planetRow: '9.9.9' });
    const findings = findHistoricalMismatches(md);
    expect(findings.length).toBe(1);
    expect(findings[0].id).toBe('planet-flag-row');
  });

  it('flags the planet-list-skew historical region when its own pinned version literal is altered (find-and-replace sweep detection)', () => {
    const md = buildFixtureMd({ skewParagraph: '9.9.9' });
    const findings = findHistoricalMismatches(md);
    expect(findings.length).toBe(1);
    expect(findings[0].id).toBe('planet-list-skew');
  });

  it('flags a semver token placed outside every known region, naming its line number', () => {
    const md = buildFixtureMd({ extraToken: '3.3.3' });
    const gaps = findCoverageGaps(md);
    expect(gaps.length).toBe(1);
    expect(gaps[0].token).toBe('3.3.3');
    expect(typeof gaps[0].line).toBe('number');
  });

  it('throws a distinctly-named error when an anchor is missing', () => {
    expect(() => extractRegion('no anchors in here at all', '**Planet-list skew.**', 'paragraph')).toThrow(
      /anchor not found/,
    );
  });

  it('throws a distinctly-named, different error when an anchor is ambiguous (duplicated)', () => {
    const duplicated = '**Planet-list skew.** one\n\n**Planet-list skew.** two\n';
    expect(() => extractRegion(duplicated, '**Planet-list skew.**', 'paragraph')).toThrow(/anchor is ambiguous/);
  });
});
