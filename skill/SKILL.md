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
