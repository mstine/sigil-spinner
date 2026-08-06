# Sigil Spinner

A Node CLI + importable library that generates planetary sigils from intention
statements using the traditional Western esoteric method: strike vowels and
repeating letters, encode the remainder through the Pythagorean Number Table,
and trace the resulting number sequence across the chosen planet's kamea
(magic square). Output is fully CSS-stylable inline SVG plus a JSON "working"
describing the full derivation.

## Usage

### Library

```js
import { generateSigil } from 'sigil-spinner';

const { svg, working } = generateSigil('I will succeed', 'saturn');
```

`generateSigil(statement, planet, options)` is a pure, synchronous function —
no I/O, no module-level mutable state. It returns a plain object with two
keys:

- `svg` — a self-contained, `viewBox`-based inline SVG string, fully
  CSS-stylable via classes and `var(--sigil-*, <fallback>)` custom properties.
- `working` — the full JSON derivation trail (see Worked Example below):
  `statement`, `planet`, `kameaSet`, `gridSize`, `lettersKept`,
  `lettersStruck`, `letterNumbers`, `numbers`, `cells`, `segments`, `start`,
  `end`.

`planet` is required — one of `saturn`, `jupiter`, `mars`, `sun`, `venus`,
`mercury`, `moon`, matched case-insensitively. There is no default planet
(choosing it is part of the working, not a fallback). `options.title`, when
`true`, embeds the XML-escaped statement in the SVG's `<title>` element —
omitted by default (see Data Handling below).

### CLI

```
sigil-spinner <statement> --planet <name> [--json] [--output <file>]
```

- `<statement>` — the intention statement, as a positional argument. Pass
  `-` to read the statement from stdin instead (e.g.
  `echo "I will succeed" | sigil-spinner - --planet saturn`), which is what
  lets the tool compose in a shell pipeline.
- `--planet <name>` — required, case-insensitive, one of the seven names
  above.
- `--json` — write the JSON working to stdout instead of the raw SVG.
- `--output <file>` — write the selected artifact to a file instead of
  stdout; stdout is left completely empty. `--output`'s write is **not
  atomic** — a process killed mid-write, or two concurrent invocations
  writing the same path, can leave a partially-written file at that path.

Getting both artifacts from the CLI means two invocations (once plain, once
with `--json`) — there is no dual-file flag. The determinism contract below
is what guarantees the two invocations describe the same sigil.

All diagnostics (errors, usage messages) go to `stderr`; `stdout` carries
only the requested artifact, so a build pipeline can pipe it directly.

## Determinism

The same statement, planet, and options always produce **byte-identical**
SVG and byte-identical JSON, across repeated calls, across processes, and
whether invoked through the library or the CLI. Sigils are reproducible
design elements, not random art — this is what makes them safe to embed in
a page and commit to source control. `test/determinism.test.js` asserts this
with byte-equality checks (not "ran it twice, looked the same") and two
committed file snapshots (`test/__file_snapshots__/worked-example.svg` and
`worked-example.working.json`) that fail loudly on any drift in coordinate
rounding, attribute ordering, or field ordering.

## Worked Example

Statement: `"I WILL SUCCEED"`, planet: `saturn`.

1. **Strike vowels (A, E, I, O, U):** `I`, `W`, `I`, `L`, `L`, `S`, `U`, `C`,
   `C`, `E`, `E`, `D` → consonants in order: `W, L, L, S, C, C, D`.
2. **Strike repeats, keep first occurrence:** the second `L` and the second
   `C` are struck → kept letters: `W L S C D`.
3. **Encode via the Pythagorean cycling table:** `W=5, L=3, S=1, C=3, D=4`.
4. **Number sequence:** `5, 3, 1, 3, 4`.
5. **Look up each digit's cell on the Saturn kamea** (`cellForNumber`,
   zero-indexed row/col): `5→(1,1)`, `3→(1,0)`, `1→(2,1)`, `3→(1,0)`,
   `4→(0,0)`.
6. **Trace the path:** `(1,1) → (1,0) → (2,1) → (1,0) → (0,0)` — start
   marker at `(1,1)`, end marker at `(0,0)`. Cell `(1,0)` is revisited but
   not consecutively, so no repeat marker fires (Phase 2 scope).

A practitioner can check this by hand against the committed working
snapshot at `test/__file_snapshots__/worked-example.working.json`.

## Letter Handling Rules

This is the tool's public statement of its own method — a practitioner
should be able to read this section and predict what the tool does to any
statement, in the same citable-lineage posture as
[Kamea Source Lineage](#kamea-source-lineage) below.

1. **Vowels are struck; Y is always a consonant (D-21).** `A`, `E`, `I`, `O`,
   `U` are struck as vowels. `Y` is never treated as a vowel — it is kept
   unless it is struck as a repeat — with no contextual or phonetic
   detection of Y's dual nature in English (e.g. "rhythm" vs. "yes").
   `normalize('RHYTHM')` keeps `R H Y T M` (the second `H` is struck as a
   repeat); `normalize('YES')` keeps `Y S` (`E` is struck as a vowel).

2. **Accents are ignored; the base letter is used (D-22).** Every character
   is folded via Unicode NFD (Normalization Form Canonical Decomposition)
   with combining marks stripped, so an accented letter contributes its base
   Latin letter before classification. `É` folds to `E` and is then struck
   as a vowel; `Ñ` folds to `N` and is kept. Worked line: `normalize('ÑU')`
   folds `Ñ` → `N` (kept) and `U` is struck as a vowel, so the statement
   keeps only `N`.

3. **Six non-decomposable Latin letters use an explicit table (D-23).** NFD
   cannot resolve these — they are ligatures or letters with no accent to
   strip — so they are transliterated via a fixed, case-sensitive table
   before classification:

   | Character | Folds to |
   |-----------|----------|
   | `ß` | `SS` |
   | `ẞ` | `SS` |
   | `æ` | `AE` |
   | `Æ` | `AE` |
   | `œ` | `OE` |
   | `Œ` | `OE` |
   | `ø` | `O` |
   | `Ø` | `O` |
   | `þ` | `TH` |
   | `Þ` | `TH` |
   | `ð` | `D` |
   | `Ð` | `D` |

4. **Non-Latin script characters are struck as non-letters (D-24).** A
   character from a non-Latin script (Greek, Cyrillic, Hebrew, CJK, etc.) is
   struck with reason `non-letter` and recorded in the struck trail, exactly
   like punctuation or whitespace. A wholly non-Latin statement therefore
   reduces to zero kept letters and produces the `E_EMPTY_SEQUENCE` error
   below — there is no dedicated non-Latin error code.

### Consecutive-repeat loops

When the traced number sequence hits the same kamea cell on two or more
*consecutive* steps, the SVG gains one `<path class="sigil-loop">` element
per extra visit — hidden by default like the other markers, revealable via
`var(--sigil-marker-stroke, ...)`. A cell visited non-consecutively (the
same digit appears again later in the sequence, but not back-to-back) gets
no loop — see the worked example above, where `(1,0)` repeats but not
consecutively. A repeat landing on the start or end cell renders its loop
alongside the boundary marker, offset so neither obscures the other, rather
than suppressing either one.

## Errors and Exit Codes

Every library error is a `SigilError` with a stable `.code` — consumers
branch on `.code`, **never on message text**, which is free-form and can
change without notice. `SigilError` instances may also carry an optional
`.details` structured payload (D-26) — still never branched on, purely for
programmatic introspection.

| Code | Meaning | CLI exit status |
|------|---------|------------------|
| `E_MISSING_STATEMENT` | The statement argument was missing, empty, or not a string. | 2 |
| `E_MISSING_PLANET` | `--planet`/the planet argument was missing, empty, or not a string — there is no default planet. | 2 |
| `E_UNKNOWN_PLANET` | The planet name wasn't one of the seven classical planets. The message lists all seven. | 2 |
| `E_EMPTY_SEQUENCE` | The statement reduced to zero kept letters after striking vowels and repeats. The message names the total struck count and a per-reason breakdown (e.g. "all 5 characters struck (5 vowels)"), and `.details.struck` carries the full structured struck list. | 3 |

Usage-class errors (`E_MISSING_STATEMENT`, `E_MISSING_PLANET`,
`E_UNKNOWN_PLANET`) exit with status `2`; the derivation-class error
(`E_EMPTY_SEQUENCE`) exits with status `3` — a calling script can branch on
exit status alone, without parsing stderr text. Any other error exits with
status `1`.

## Data Handling

`working.statement` is **untrusted user input**. This library returns data,
not markup, and does not escape it — any consumer that renders
`working.statement` into HTML (e.g. a teaching page narrating the
derivation) **must HTML-escape it first**.

The intention statement is deliberately absent from the SVG artifact by
default — no `<title>`, no `<desc>`, no data attribute carries it unless the
caller opts in via `{ title: true }` — honoring the release-the-intention
posture of classic sigil practice (D-16). When opted in, the statement is
XML-escaped before being embedded.

## What This Tool Does Not Yet Do

All seven kameas are locked, tested, and byte-stable end to end as of
Phase 2 (see `test/determinism.test.js`'s seven-planet matrix). Curved/
smoothed path rendering, the toggleable grid layer, the planetary glyph
layer, and multi-embed id namespacing remain Phase 3 scope.

## Kamea Source Lineage

The seven classical planetary kameas (magic squares) ship under the `agrippa`
kamea set — `KAMEA_SETS.agrippa` in `src/data/kamea.js`, selected by default
via `DEFAULT_KAMEA_SET`. The data layer is kamea-set-aware from day one so a
future independently-verified set (e.g. a Skinner-sourced set) can be added
under a new key without reshaping the API; only `agrippa` ships in this
phase.

**Primary source (named by the project's locked decision, D-01):**
Agrippa, Henry Cornelius. *Three Books of Occult Philosophy.* Donald Tyson,
ed. Llewellyn Publications.

**Independent cross-check source (named by D-01):**
Skinner, Stephen. *The Complete Magician's Tables.* Golden Hoard Press.

**What was actually verified (honest provenance):** both sources above are
physical books not available to research or execution tooling. The seven
grids below were sourced from a single secondary web source
(furtherlight.blogspot.com, "Agrippa's Magic Squares - Part 2"), verified
cell-by-cell for internal magic-square correctness (every row, column, and
both diagonals sum to the correct magic constant for all seven grids), and
Saturn's full grid plus Jupiter's opening row were independently corroborated
against a second, separate web source. Mars, Sun, Venus, Mercury, and Moon
rest on the single furtherlight source only. This candidate set was signed
off via the project's D-04 checkpoint (decision: approve-candidate) on
2026-08-04 — it is not a claim that any grid was checked cell-by-cell against
the physical Tyson/Llewellyn or Skinner editions named above. See the module
header in `src/data/kamea.js` for the full citation.

**Ordering convention:** every grid is row-major, top row first, left to
right — `grid[0][0]` is the top-left cell.

**Grid order and magic constants:** Saturn (3×3, 15), Jupiter (4×4, 34), Mars
(5×5, 65), Sun (6×6, 111), Venus (7×7, 175), Mercury (8×8, 260), Moon (9×9,
369).
