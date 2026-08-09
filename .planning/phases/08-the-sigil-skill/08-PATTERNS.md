# Phase 8: The Sigil Skill - Pattern Map

**Mapped:** 2026-08-09
**Files analyzed:** 8 (new/modified)
**Analogs found:** 6 / 8 (2 have no in-repo analog — noted below with external references)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `skill/SKILL.md` | config (markdown, frontmatter + prose) | request-response (Claude-Code-consumed) | `~/.claude/skills/capture/SKILL.md`, `~/.claude/skills/draft/SKILL.md` | role-match (external, no in-repo analog) |
| `skill/references/correspondences.md` | config (reference doc) | transform (read-on-demand) | none in-repo | no analog |
| `skill/VERIFY.md` | test (human-run procedure, not code) | request-response (procedural checklist) | none in-repo — closest conceptual precedent is `examples/element.html` as "the instrument, not documentation" | partial match (conceptual only) |
| `scripts/skill-install.mjs` (or `package.json` script) | utility (file-I/O, one-directional sync) | file-I/O / batch | `test/pack-install.test.js` (scratch-dir + fs builtins idiom) | partial match |
| `test/skill-cli-parity.test.js` | test (drift guard, text-parse) | transform (text→Set, set-equality assertion) | `test/element-docs.test.js` | exact |
| `test/skill-install-parity.test.js` (or folded into above) | test (conditional no-op guard) | file-I/O / batch | `test/pack-install.test.js` (scratch-dir fs walk) + `test/browser/*` (fail-loud-with-instructions precedent, for the *shape* of the one exception) | role-match |
| `package.json` (`scripts` key only) | config | CRUD (one key added) | `package.json` itself, prior edits by Phase 6/7 (no separate analog file) | exact (self-referential) |
| `skill/` directory placement + `files`/`exports` (NOT edited) | n/a — deliberate non-target | n/a | `examples/` (repo-only dir excluded from `files`) | exact precedent for the *shape*, D-100 |

## Pattern Assignments

### `test/skill-cli-parity.test.js` (test, transform / drift-guard)

**Analog:** `test/element-docs.test.js` (full file read above, 104 lines)

**Imports pattern** (lines 1-4):
```javascript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
```

**Header-comment discipline to copy verbatim in spirit** (lines 6-26): state the guard's ID (D-107), state explicitly that the subject file is **read as text and never imported**, and name *why* — `bin/sigil-spinner.js` reads `process.argv` and calls `process.exit` at parse time (via `diagnose`), the same class of import-time side effect that made `HTMLElement` dereference throw in `sigil-spinner-element.js`. Cite the precedent this file is following, the same way `element-docs.test.js` cites `test/citations.test.js`.

**Setup — resolve paths once, module-level** (lines 28-35):
```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const elementSource = readFileSync(
  path.join(REPO_ROOT, 'src/element/sigil-spinner-element.js'),
  'utf-8',
);
const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf-8');
```
Adapt directly: replace with `skill/SKILL.md` and `bin/sigil-spinner.js` reads.

**Extraction function shape — flat side (SKILL.md flag table)** (lines 43-55, 64-77): a named `parseXxx(source)` function, each one throwing a named `Error` if its anchor regex/section doesn't match (never silently returning empty), returning a `Set<string>`. This is the template for `parseSkillFlagTokens(md)` — reuse near-verbatim; RESEARCH.md's own worked example (row-regex `^\|\s*`--([a-z-]+)`\s*\|/gm`) is drop-in compatible with this shape.

**Extraction function shape — CLI side (nested object)** — **this is the one place the template must be *adapted*, not copied.** `observedAttributes` is a flat array (`return [...]`), regex-extractable in one line (line 44). `bin/sigil-spinner.js`'s `options: { … }` (lines 117-127, read live) is a **nested, multi-line object literal**:
```javascript
// bin/sigil-spinner.js:117-127
parseArgs({
  allowPositionals: true,
  options: {
    planet: { type: 'string' },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
    glyph: { type: 'boolean', default: false },
    curve: { type: 'boolean', default: false },
    'id-prefix': { type: 'string' },
    title: { type: 'boolean', default: false },
  },
});
```
A flat per-line regex (mirroring `parseObservedAttributes`'s approach) works today but silently undercounts after a Prettier reformat or a future multi-line default. RESEARCH.md's Code Examples section supplies a brace-counted extraction (`parseCliOptionKeys`) that walks the source char-by-char, tracking brace depth, splitting top-level entries at depth-0 commas — this is the correct pattern to implement, not the flat-line regex. Reuse it directly; it already follows this repo's "fail loudly with a named error if it parses zero flags" discipline (D-109 / the zero-match guard below).

**Zero-match guard test** (lines 80-85):
```javascript
describe('...', () => {
  it('parses a non-empty attribute set from both the element source and the README table', () => {
    const codeAttributes = parseObservedAttributes(elementSource);
    const readmeAttributes = parseReadmeAttributes(readme);
    expect(codeAttributes.size, 'parsed zero attributes from observedAttributes').toBeGreaterThan(0);
    expect(readmeAttributes.size, 'parsed zero attributes from the README table').toBeGreaterThan(0);
  });
```
Copy directly — this is the guard against a regex that silently stops matching and turns the whole check green (D-109's fail-first discipline references this exact class of failure).

**Bidirectional set-difference assertion with named diffs** (lines 87-102):
```javascript
it("the README's documented attribute set matches observedAttributes exactly, in both directions", () => {
  const codeAttributes = parseObservedAttributes(elementSource);
  const readmeAttributes = parseReadmeAttributes(readme);

  const readmeOnly = [...readmeAttributes].filter((name) => !codeAttributes.has(name));
  const codeOnly = [...codeAttributes].filter((name) => !readmeAttributes.has(name));

  expect(
    readmeOnly,
    `README documents attribute(s) not in observedAttributes: ${readmeOnly.join(', ')}`,
  ).toEqual([]);
  expect(
    codeOnly,
    `observedAttributes has attribute(s) undocumented in README: ${codeOnly.join(', ')}`,
  ).toEqual([]);
});
```
Copy near-verbatim, substituting `skillFlags`/`cliOptionKeys` for `readmeAttributes`/`codeAttributes`. This is the exact bidirectional shape D-107 requires ("a flag the skill documents that the CLI lacks fails, and a CLI flag the skill omits also fails").

**D-108's allowlist discriminator** — no direct in-repo analog for an *empty-but-present* allowlist array with per-entry comments, but the nearest shape in spirit is `MINIMUM_CITATION_SITE_COUNT` in `test/citations.test.js` (line 43) — a named constant with a comment explaining its floor and why it must never silently regress. Model `INTENTIONALLY_UNDOCUMENTED` the same way: a `const INTENTIONALLY_UNDOCUMENTED = [];` with a comment stating its emptiness is a fact about current state, not a design absence, and that any future entry requires a reason string.

**Fail-first proof (D-109)** — pattern from `test/citations.test.js`'s "Citation checker soundness" describe block (lines 522-580): a second `describe` block with fixture-backed tests that construct a synthetic bad input via a source-string variant of the parse function (not a real file on disk) and assert the guard actually fires. Example shape to follow for D-107's two required fixtures:
```javascript
// modeled on test/citations.test.js's checkSource(source, relPath) fixture pattern
describe('skill-cli-parity soundness (D-109)', () => {
  it('fails when the skill documents a flag the CLI does not have', () => {
    const fakeSkillMd = '| `--nonexistent` | boolean | made up |\n';
    // assert parseSkillFlagTokens(fakeSkillMd) produces a set-difference against
    // the real CLI options that is non-empty
  });
  it('fails when the CLI has an option the skill omits', () => {
    // construct a fake CLI source string with an extra option key, assert
    // parseCliOptionKeys(fakeSource) diffs against the real skill flags
  });
});
```
Note `test/citations.test.js` factors its core logic as `checkSource(source, relPath)` — a pure function taking source TEXT rather than a file path — specifically so fixtures can be constructed as literal strings without touching disk. Apply the same factoring here: `parseSkillFlagTokens`/`parseCliOptionKeys` already take strings, which is what makes fixture-based fail-first proof cheap.

---

### `test/skill-install-parity.test.js` (test, conditional no-op guard, D-101)

**Analog:** No exact in-repo precedent for the *conditional* shape (this repo's other guards are unconditional-fail — see `test/browser/*`'s "fails with install instructions rather than skipping when chromium is absent," cited in D-101 itself as the contrast case). Closest structural analog for the file-tree-walk mechanics is `test/pack-install.test.js`'s scratch-directory approach — same `node:fs`/`node:os`/`node:path` builtins-only idiom, no new dependency.

**Imports pattern** (borrowed from `test/pack-install.test.js` lines 1-11 and RESEARCH.md's own Code Examples):
```javascript
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
```

**Conditional no-op shape (D-101)** — RESEARCH.md supplies the concrete recommended shape (Code Examples § "D-101's install-parity guard"); reproduced here as the pattern to implement:
```javascript
const INSTALLED_ROOT = path.join(os.homedir(), '.claude', 'skills', 'sigil');
const REPO_ROOT_SKILL = path.join(REPO_ROOT, 'skill');

it('~/.claude/skills/sigil/ is byte-identical to skill/ when present (D-101)', () => {
  if (!existsSync(INSTALLED_ROOT)) {
    console.log(
      '[skill-install-parity] SKIP (expected, not a failure): ' +
        `${INSTALLED_ROOT} does not exist on this machine. ` +
        "This is a correct state on any machine that is not Matt's — the " +
        'guard is a no-op rather than a failure here (D-101).',
    );
    return; // explicit, message-printing no-op — the ONE stated exception
  }
  // walk skill/ recursively (readdirSync/statSync, mirroring
  // test/citations.test.js's walkJsFiles recursion shape), compare each
  // file's contents via readFileSync against its INSTALLED_ROOT
  // counterpart, collect every divergent path, and fail with the full list
  // in one message if any exist — same "collect all findings, report
  // together" discipline as test/citations.test.js's formatFindings.
});
```

**House idiom this must NOT violate:** every other guard in this suite fails loudly rather than skipping (stated explicitly in D-101 itself, and confirmed by `test/browser/*`'s pattern of erroring with install instructions). This file is the **one deliberate, commented exception** — the no-op branch must always print its reason; an unexplained pass is exactly what D-101's own text warns decays into decoration.

---

### `skill/SKILL.md` (config — frontmatter + prose, no in-repo analog)

**Analog:** `~/.claude/skills/capture/SKILL.md` and `~/.claude/skills/draft/SKILL.md` (both read in full above) — the only real analogs, and they are outside this repo. No in-repo file has this shape.

**Frontmatter pattern to copy** (from `capture/SKILL.md` lines 1-9):
```yaml
---
name: capture
scope: personal
description: Capture raw material — text, quotes, URLs, observations — into a swipe file with zero filing decisions
argument-hint: [text, URL, or quote to capture]
allowed-tools:
  - mcp__psyche-capture__capture
  - mcp__psyche-capture__list_focus_areas
  - mcp__psyche-threads__list_threads
---
```
Adapt: `name: sigil`, `scope: personal` (house convention, confirmed inert-but-present per RESEARCH.md Pitfall 2 — keep for consistency, don't describe as functionally load-bearing), `description` per D-102's five required elements, `allowed-tools` listing `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep` per D-103 (note: RESEARCH.md corrects the *reason* — it's pre-approval to avoid a mid-cold-session permission prompt, not a hard restriction; `argument-hint` is optional here since this skill fires on natural-language description-matching rather than an explicit slash-command argument, per SKILL-01).

**Body structure precedent:** `draft/SKILL.md` demonstrates the house pattern of embedding a full non-negotiable constraint block (its "Voice Constraints" section) directly in the skill body rather than delegating to a reference file for content that must always load — this is the same justification D-105 uses for keeping the flag table and planet table inline rather than in `skill/references/`. Progressive disclosure (skill body vs. `skill/references/*.md`) is a platform-level pattern (RESEARCH.md § Pattern 1), not something with an in-repo precedent — cite RESEARCH.md directly rather than a codebase file.

**No in-repo analog exists** for the flag-table + planet-correspondence-table content itself. Content should be authored fresh per D-104–D-112, using the markdown-table shape RESEARCH.md recommends specifically because it's a drop-in reuse of `element-docs.test.js`'s row-regex idiom (see above).

---

### `skill/references/correspondences.md` (config — reference doc, no in-repo analog)

**Analog:** None in-repo. No existing file in this codebase carries lineage-attributed symbolic content. Author fresh per D-110–D-112 (seven-row table's worked-example expansion, attribution line with capture date, per `~/.psyche/identity/behaviors.md` § Corpus-Grounded Readings for how the draft is sourced before Matt's ratification gate).

---

### `skill/VERIFY.md` (procedural checklist, not code — no in-repo analog)

**Analog:** No file in this repo is quite this shape (a fixed, repeatable human-run procedure). The closest *conceptual* precedent, per CONTEXT.md's own framing, is `examples/element.html` from Phase 7 — "the instrument the check is performed with, not documentation that happens to be viewable" (D-95's argument, reused verbatim for D-118). Structurally: fixed prompts, fixed pass/fail criteria, no ambiguity about what "done" means — same rigor as a test file's assertions, expressed in prose because the check itself cannot be automated (D-119).

---

### `scripts/skill-install.mjs` (utility, file-I/O, one-directional sync)

**Analog:** No exact precedent (no existing script in this repo copies files one-directionally with a diverge-and-fail check). Closest mechanical analog is `test/pack-install.test.js`'s scratch-directory + `node:fs` builtins approach (`mkdirSync`, `readdirSync`, `readFileSync`, `writeFileSync`, `rmSync` — all already used together in that file for comparable file-tree work). Reuse the same builtins-only posture (no new dependency, per RESEARCH.md's "Don't Hand-Roll" table explicitly rejecting `stow`/`chezmoi`). Constraint from CONTEXT.md: must be one-directional (repo → home) and must fail rather than silently overwrite a diverged destination.

---

### `package.json` (`scripts` key only)

**Analog:** self-referential — no separate pattern file needed. One new key, `"skill:install": "node scripts/skill-install.mjs"` (or equivalent), added to the existing `scripts` block (current shape at lines 22-30, reproduced above). `exports`, `files`, `main`, `bin`, `version`, `dependencies`, `devDependencies` are all untouched per D-99/D-100/RESEARCH.md.

---

## Shared Patterns

### Guards are keyed, not transcribed
**Source:** `test/element-docs.test.js` (never restates `observedAttributes`' contents as a literal), `test/package-identity.test.js` (never restates `package.json`'s `name` as a literal), `test/citations.test.js`'s `MINIMUM_CITATION_SITE_COUNT` comment (explicitly documents the "guards are keyed, not transcribed" precedent by ID: D-55/D-61/D-65).
**Apply to:** `test/skill-cli-parity.test.js` — never hardcode the seven flag names as a literal array anywhere in the test; both sides must be *derived* from their source files.

### Parse as text, never import
**Source:** `test/element-docs.test.js` lines 18-25 (header comment stating why), `test/citations.test.js` (treats `.js` sources as text throughout).
**Apply to:** `test/skill-cli-parity.test.js` reading `bin/sigil-spinner.js` (which calls `process.exit` via `diagnose` and reads `process.argv` at parse time) and `skill/SKILL.md` (markdown, never a code-import concern but stated for symmetry).

### Fail-first-proven guards
**Source:** `test/citations.test.js`'s "Citation checker soundness" describe block (lines 522-580) — eight fixture-backed tests proving the checker actually discriminates, written after the 05-04 lesson that an unsound checker (whitespace-only excerpt, ±200-char window bleed) passed review undetected.
**Apply to:** both `test/skill-cli-parity.test.js` directions (D-109) — a fabricated `--nonexistent` skill flag and a CLI-only undocumented option must each be demonstrated to fail the guard, using literal source-string fixtures rather than files on disk (mirrors `checkSource(source, relPath)`'s string-first signature).

### Collect-all-findings, report-together
**Source:** `test/citations.test.js`'s `collectFindings()` / `formatFindings()` pair — every offending site is gathered before failing once, with a stable sort so repeat runs produce byte-identical output (also asserted as its own test, lines 515-519).
**Apply to:** the D-101 install-parity guard's divergent-file list, if more than one file diverges — report all of them in one message rather than failing on the first.

### Fail loudly, never skip — except one named, printing exception
**Source:** stated as house convention across the suite (D-101's own text cites `test/browser/*` as the contrast: chromium-absent fails with install instructions, never a silent skip).
**Apply to:** `test/skill-install-parity.test.js` — the *only* place in this phase (and, per CONTEXT.md, in the whole suite) where a conditional no-op is correct, and it must print why.

### Repo-only directories excluded from the npm tarball
**Source:** `examples/` (confirmed absent from `package.json`'s `files: ["src", "bin", "README.md"]`, and from `test/pack-install.test.js`'s `EXPECTED_TARBALL_FILES`/`ALLOWED_TARBALL_ROOTS`).
**Apply to:** `skill/` — same shape, same non-edit. Per D-100 and the phase's own orienting note, `test/pack-install.test.js` needs **no** edit this phase; do not add a `skill/` row to `EXPECTED_TARBALL_FILES` by pattern-matching Phase 7's `examples/` precedent, which *was* edited for a different reason (the custom element, not a doc/skill directory).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `skill/SKILL.md` | config (markdown skill) | request-response | No in-repo file has Agent-Skills frontmatter; nearest precedent is external (`~/.claude/skills/capture/SKILL.md`, `~/.claude/skills/draft/SKILL.md`, and `oracle/SKILL.md` per D-102's SKIP-clause research) |
| `skill/references/correspondences.md` | config (reference/lineage doc) | transform | No file in this repo carries attributed symbolic/lineage content; content is genuinely novel this phase, sourced via the D-113 checkpoint |
| `skill/VERIFY.md` | procedural checklist | request-response (human-run) | No repo file is a fixed human-run verification script; nearest *conceptual* precedent is `examples/element.html`'s "instrument, not documentation" framing from Phase 7 (D-95), not a copyable structural analog |
| `scripts/skill-install.mjs` | utility (file sync) | file-I/O | No existing script performs one-directional, fail-on-diverge file sync; build fresh using `node:fs` builtins in the style `test/pack-install.test.js` already establishes |

## Metadata

**Analog search scope:** `test/*.test.js` (all top-level test files read or grep-scanned), `bin/sigil-spinner.js` (parseArgs block), `package.json`, `examples/`, `~/.claude/skills/{capture,draft}/SKILL.md`
**Files scanned:** `test/element-docs.test.js` (full, 104 lines), `test/citations.test.js` (full, 581 lines), `test/package-identity.test.js` (full, 45 lines), `test/pack-install.test.js` (partial, header + imports), `bin/sigil-spinner.js` (partial, parseArgs block + diagnose), `package.json` (full), `~/.claude/skills/capture/SKILL.md` and `draft/SKILL.md` (first ~40 lines each)
**Pattern extraction date:** 2026-08-09
