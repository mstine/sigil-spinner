---
name: sigil
scope: personal
description: >-
  Generates traditional Western esoteric planetary sigils — traced across a
  planet's kamea (magic square) from a struck-and-encoded intention
  statement — as embeddable, fully CSS-stylable inline SVG. Fires on
  requests like "make me a sigil", "sigilize this intention", "planetary
  sigil", "kamea", or "sigil for a page", and whenever a sigil needs to be
  embedded into a page or site being built. Does not cover tarot spreads,
  dream interpretation, natal charts, transits, or general
  symbolic/astrological synthesis — use oracle for those — and does not
  cover decision framing — use decide.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Sigil

Generates a traditional Western esoteric planetary sigil from an intention statement: vowels and repeated letters are struck, the remainder is encoded through the Pythagorean Number Table, and the resulting number sequence is traced across the chosen planet's kamea. Output is a self-contained, viewBox-based inline SVG, fully stylable via CSS classes and custom properties — no build step, no external references.

## Invocation

Run the published CLI via `npx`. Never reference a local filesystem path or this repository's checkout location — this skill runs globally, from any directory, on any machine, including one that has never cloned this repo.

```bash
npx -y @falkensmage/sigil-spinner@latest '<statement>' --planet <planet>
```

- `-y` — skips npx's interactive install-confirmation prompt, which would otherwise stall a non-interactive session waiting for a keypress that never comes.
- `@latest` — a dist-tag, not a version pin: it forces a real registry lookup for what `latest` currently resolves to. A bare package name without a tag could instead be served from a stale local npx cache — an invisible failure in a tool whose entire contract is determinism.

**Shell safety.** An intention statement is free-form prose and can contain a quote character, a backtick, or a `$(...)` sequence. Do not naively drop it into a double-quoted template. Use one of:

- **Single-quote the statement**, escaping any embedded single quote with the standard shell idiom: `it's time` becomes `'it'\''s time'`.
- **Preferred when the command is assembled programmatically:** pipe the statement through the CLI's own `-` stdin sentinel, which sidesteps shell-quoting correctness entirely:

  ```bash
  printf '%s' "$STATEMENT" | npx -y @falkensmage/sigil-spinner@latest - --planet <planet>
  ```

**Library form**, for build scripts that already carry the dependency:

```js
import { generateSigil } from '@falkensmage/sigil-spinner';
const { svg, working } = generateSigil(statement, planet, { curve: true, idPrefix: 'hero' });
```

## Flags

This CLI has no `--help` flag (`sigil-spinner --help` exits with `E_CLI_USAGE: Unknown option '--help'`) — the table below is the mechanical reference. It is kept honest by an in-repo drift check (`test/skill-cli-parity.test.js`) that fails if this table and the CLI's real option keys diverge; do not delete this table in favor of delegating to `--help`.

| Flag | Type | Purpose |
|------|------|---------|
| `--planet` | string, required | one of the seven classical planets (saturn, jupiter, mars, sun, venus, mercury, moon) |
| `--json` | boolean | write the JSON working to stdout instead of the raw SVG |
| `--output` | string | write the selected artifact to a file instead of stdout |
| `--glyph` | boolean | render the optional planetary glyph layer |
| `--curve` | boolean | curved/smoothed path instead of straight segments |
| `--id-prefix` | string | namespace the root `<svg>` element's id, for co-embedding more than one sigil on a page |
| `--title` | boolean | embed the statement in the SVG's `<title>` element |

## Planet Selection

<!-- SKILL-02 pending: correspondences not yet captured from Matt -->

## Embedding Checklist

Five operational facts a session would otherwise learn by shipping a broken page. Treat these as instructions, not trivia.

1. **Supply a distinct `--id-prefix` per co-embedded sigil.** Two sigils sharing the same prefix collide by design — the library never derives an id from a hash of its inputs (that would produce identical ids for identical sigils, the exact collision it would claim to prevent). Uniqueness across multiple sigils on one page is the caller's documented responsibility, not a bug to discover.
2. **The grid layer is present and hidden, not absent.** Every generated sigil already carries the kamea's lattice lines and cell numbers in its markup, on every planet, with no flag to add or remove them. They start at zero opacity. One CSS declaration from the embedding page reveals both together — there is no generation-time toggle.
3. **The glyph layer is opt-in and depends on the viewer's font.** `--glyph` renders the planetary character, but it only displays correctly if the viewer's font stack covers the Miscellaneous Symbols block, U+2600 to U+26FF — an uncovered stack renders a missing-glyph box instead. There is no code-level fallback by design (an embedded font would violate the zero-runtime-dependency constraint). Override `--sigil-glyph-font` with a symbol-covering stack (for example `"Noto Sans Symbols"`) when the embedding site's default font doesn't cover that range.
4. **Numeric `--sigil-*` theming values are unitless user units**, interpreted against the fixed `0 0 100 100` viewBox — not pixels, not ems. Write the bare number.
5. **Curve mode can overshoot the viewBox on a reversal-heavy statement.** The documented instance is the `sun` kamea traced from the statement about succeeding, where a centripetal Catmull-Rom control point lands just past the viewBox's top edge. This is real curve behavior on a sharp (near-180-degree) direction reversal in the traced path, deliberately not clamped — expect it as a possibility on statements whose letter sequence reverses direction sharply, not as a defect to file.

## Going Deeper

This file carries invocation mechanics plus the judgment needed to choose a planet and embed a sigil correctly — not everything the package can do. Four bodies of depth are deliberately not restated here, because every line restated here is a line that can drift from the code that actually governs it:

- The full fifteen-property `--sigil-*` theming surface — every custom property, its default, and the element it targets
- The complete error-code and CLI exit-status tables
- The letter-handling and folding rules — which characters strike, which fold to a base letter, and why
- The JSON working's full field-by-field description

Read either of these, and only when the task actually needs that depth — one hop, never through an intermediate file:

- The installed package's own README, at `node_modules/@falkensmage/sigil-spinner/README.md`, once the consuming project has installed the package or run it via `npx`
- The project repository, at `https://github.com/mstine/sigil-spinner`

## Published-Surface Boundary

The published package resolves to version `1.0.0` as of 2026-08-09 (`npm view @falkensmage/sigil-spinner version` and `exports`, re-queried live at authoring time rather than assumed). Its `exports` map exposes only `.` — no browser custom-element subpath. A `<sigil-spinner>` custom element exists in this project's own working tree, but it has never been published; this skill therefore documents inline-SVG embedding only and does not instruct a session to import an element entry point, which would fail with a package-path-not-exported error on every machine that installs from the registry. If a future publish adds that subpath, this section is the place to extend the skill, and the drift-check parity guard would need extending alongside it.
