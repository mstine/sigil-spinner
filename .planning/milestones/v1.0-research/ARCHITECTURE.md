# Architecture Research

**Domain:** Text-to-geometry-to-SVG generator, dual CLI/library Node package
**Researched:** 2026-08-04
**Confidence:** HIGH — this is a well-understood architectural shape (deterministic pipe-and-filter pipeline + thin-CLI-over-pure-library), not a domain requiring speculative pattern-matching. The kamea/Pythagorean specifics come from PROJECT.md, which is treated as ground truth.

## Standard Architecture

### System Overview

Sigil Spinner is a **pure, one-directional pipeline** wrapped by two thin consumers (CLI and library-facade). Every pipeline stage is a pure function: same input → same output, no I/O, no hidden state. Determinism is a hard project constraint (PROJECT.md), and pure-function pipelines are the only architecture that guarantees it without discipline-by-convention.

```
┌───────────────────────────────────────────────────────────────────────┐
│                         CONSUMERS (thin, I/O only)                    │
│  ┌────────────────────┐              ┌────────────────────────────┐  │
│  │   bin/cli.js (CLI)  │              │  src/index.js (library API) │  │
│  │  argv → call lib →  │─────calls───▶│  generateSigil(statement,   │  │
│  │  write stdout/file  │              │  planet, options)           │  │
│  └────────────────────┘              └───────────────┬──────────────┘  │
└────────────────────────────────────────────────────────┼──────────────┘
                                                           │ orchestrates
┌──────────────────────────────────────────────────────────▼──────────────┐
│                         CORE PIPELINE (pure, no I/O)                    │
│                                                                          │
│  statement ──▶ [1 text] ──▶ [2 encode] ──▶ [3 resolve] ──▶ [4 path]     │
│                 letters       numbers        cells         PathModel   │
│                                                                 │       │
│                                              ┌──────────────────┘       │
│                                              ▼                          │
│                              ┌───────────────────────────────┐         │
│                              │        RENDER LAYER            │         │
│                              │  [5a SVG string]  [5b JSON]    │         │
│                              └───────────────────────────────┘         │
├──────────────────────────────────────────────────────────────────────┤
│                          STATIC DATA (owned, canonical)                │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐    │
│  │ Pythagorean   │   │ 7 kamea squares   │   │ planetary glyphs   │    │
│  │ letter table  │   │ (Saturn..Moon)    │   │ (♄♃♂☉♀☿☽)          │    │
│  └──────────────┘   └──────────────────┘   └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| **text/normalize** | Strike vowels, strike repeated letters (keep first occurrence, preserve order) | Pure function, string → array of kept letters. No knowledge of numbers or kamea exists here. |
| **encoding/pythagorean** | Map each kept letter to its 1–9 digit via the canonical Pythagorean table | Static lookup table (object/array) + one pure mapping function. No knowledge of planets. |
| **data/kamea** | Own the seven canonical magic squares and answer "where does digit N sit in planet P's square?" | Static data module (arrays of arrays, one per planet) + one pure resolver function `cellForNumber(planet, n) → {row, col}` and `gridSize(planet) → n`. This is the single source of truth — nothing else hardcodes cell positions. |
| **path/pathBuilder** | Turn a number sequence + planet into an abstract, renderer-agnostic geometric model: ordered points, start/end tags, repeat-loop segments | Pure function combining `data/kamea` + the number sequence. Emits a plain, JSON-serializable object (the **PathModel**) — no SVG, no strings, no curve math. |
| **render/svg** | Turn a PathModel + render options into a self-contained SVG string | Template-literal string building (no DOM, no dependency — Node has no `document`). Sub-renderers per layer: grid, path, nodes, start/end markers, repeat-loop markers, glyph. Curve-vs-straight is decided *here*, not in the path model. |
| **render/json** | Turn the full pipeline result (statement, kept letters, numbers, PathModel) into the "working" JSON | Thin serializer. Only exists because the orchestrator retains intermediate stages — it has nothing to compute itself. |
| **core (orchestrator)** | Wire stages 1–4 together, retain every intermediate value, expose the public library API | `generateSigil(statement, planet, options) → SigilResult` where `SigilResult` carries `{ statement, lettersKept, numbers, planet, gridSize, path }` plus `.toSVG(opts)` / `.toJSON()` methods (or equivalent plain functions taking the result). This is the *only* component allowed to know about the whole pipeline. |
| **cli** | Parse argv, call the orchestrator, write to stdout/file | Argument parsing (commander or equivalent) + I/O. Zero domain logic — if a CLI flag needs validation logic, that logic lives in `core`/`data`, and the CLI just surfaces the error. |

## Recommended Project Structure

```
src/
├── data/
│   ├── kamea.js           # the 7 canonical squares + cellForNumber()/gridSize()
│   ├── pythagorean.js     # letter → 1-9 table + lookup fn
│   └── glyphs.js          # planet → unicode/path glyph
├── text/
│   └── normalize.js       # strike vowels + duplicates, preserve order
├── path/
│   └── buildPath.js       # numbers + planet -> PathModel (pure geometry)
├── render/
│   ├── svg.js             # PathModel + options -> SVG string
│   ├── svg/               # per-layer sub-renderers (grid, path, markers, glyph)
│   │   ├── grid.js
│   │   ├── pathLayer.js
│   │   ├── markers.js
│   │   └── glyphLayer.js
│   └── json.js            # pipeline result -> "working" JSON
├── generate.js             # orchestrator: generateSigil(statement, planet, opts)
└── index.js                 # public library entry (re-exports generateSigil + types)
bin/
└── sigil-spinner.js         # thin CLI: argv -> index.js -> stdout/file
test/
├── data/                    # canonical-correctness tests (exact match to source kameas)
├── text/
├── path/
└── render/
```

### Structure Rationale

- **`data/` is isolated and dependency-free.** Canonical correctness (PROJECT.md: "must match the traditional sources exactly, no 'close enough'") is the highest-risk area in the whole project. Isolating it means it can be tested in complete isolation against a hand-verified reference, and every other module treats it as a black-box lookup — a bug in kamea data can't hide behind pipeline logic.
- **`text/` and `data/pythagorean.js` have no dependency on `data/kamea.js`.** Letter-stripping and number-encoding are planet-agnostic. Keeping that boundary real (not just aspirational) means these modules are trivially unit-testable without touching kamea data at all, and a future non-kamea numerology mode (however unlikely) would not require touching them.
- **`path/buildPath.js` is the seam between "symbolic" and "geometric."** It is the only module that combines a number sequence with a planet. Its output (PathModel) is a plain object — no rendering concerns leak in. This is what makes the JSON "working" emitter trivial (PathModel is already JSON) and what makes SVG rendering swappable/testable against fixtures without running the whole pipeline.
- **`render/svg/` is split per layer** because the requirements list five independently toggleable SVG concerns (path, grid, glyph, start/end markers, repeat-loop markers). Keeping them as separate functions that each return an SVG fragment (a `<g>` string) means `render/svg.js` is just composition — assemble the layers the options ask for, wrap in `<svg>`. Adding a new layer later (e.g. a numbered-node layer) doesn't touch existing layers.
- **`generate.js` is the only file that imports across `data/`, `text/`, and `path/`.** Every other module has a narrow, single-purpose dependency graph. This makes the orchestrator the one place that needs to be read to understand "the whole pipeline" — everything else is legible in isolation.
- **`bin/sigil-spinner.js` imports only `src/index.js`.** The CLI never reaches into `data/`, `path/`, or `render/` directly. This is what keeps the CLI thin and guarantees CLI and programmatic consumers get identical behavior (including validation) — because there is exactly one code path that produces a sigil.

## Architectural Patterns

### Pattern 1: Pipe-and-Filter Pipeline (core pattern for this project)

**What:** Each stage is a pure function `(input, context?) → output`. Stages compose left to right with no shared mutable state. The orchestrator is the only thing that chains them.

**When to use:** Any deterministic text/data → structured-output transform where intermediate values also need independent inspection (here: the JSON "working" needs every intermediate stage, not just the final SVG).

**Trade-offs:** Slightly more ceremony than one big function (more files, more explicit hand-offs), but it's what makes (a) determinism auditable, (b) each stage unit-testable without mocking, and (c) the JSON working emitter nearly free — it's just "serialize what the orchestrator already collected."

**Example:**
```js
// generate.js
function generateSigil(statement, planet, options = {}) {
  const lettersKept = normalize(statement);
  const numbers = lettersKept.map(toPythagoreanDigit);
  const cells = numbers.map(n => cellForNumber(planet, n));
  const path = buildPath(numbers, cells, planet);
  return { statement, lettersKept, numbers, planet, gridSize: gridSize(planet), path };
}
```

### Pattern 2: Renderer-Agnostic Intermediate Model (PathModel)

**What:** `path/buildPath.js` never emits SVG or strings — it emits a plain object describing geometry and semantics (points, segment types, start/end tags). Renderers (SVG, JSON) consume this model without knowing how it was produced.

**When to use:** Whenever a single computed result needs to feed two or more output formats. Here: SVG and JSON both need the same geometry; computing it twice (once per format) would risk the two outputs disagreeing, which breaks the "JSON working describes the SVG" guarantee.

**Trade-offs:** Requires deciding the model's shape up front and resisting the urge to bake rendering decisions (e.g. curve control points) into it. The payoff is that curve-vs-straight becomes a render-time option instead of a second code path through the geometry logic.

**Example PathModel shape:**
```js
{
  planet: 'mars',
  gridSize: 5,
  points: [
    { n: 3, row: 0, col: 2, x: 2, y: 0 },
    { n: 7, row: 4, col: 3, x: 3, y: 4 },
    // ...
  ],
  segments: [
    { from: 0, to: 1, type: 'line' },
    { from: 1, to: 1, type: 'repeat-loop' }, // consecutive same-number hit
  ],
  start: 0,
  end: 4
}
```

### Pattern 3: Thin CLI Over Stable Library API

**What:** The CLI is argv parsing plus exactly one call into the library's public function, plus stdout/file I/O. No validation, defaulting, or business logic lives in the CLI that the library doesn't also enforce.

**When to use:** Any package published as both a CLI and an importable library (this project's explicit requirement). Standard, well-established pattern in the Node ecosystem — e.g. `commander`-based CLIs commonly export handler functions from a library module and have the CLI file do nothing but wire flags to them.

**Trade-offs:** None significant here — the discipline cost is low and the payoff (identical behavior in both consumption modes, easy testing of business logic without spawning a subprocess) is high given "primary consumer is Claude Code during build pipelines" (PROJECT.md).

**Example:**
```js
// bin/sigil-spinner.js
#!/usr/bin/env node
import { generateSigil, toSVG, toJSON } from '../src/index.js';
program
  .argument('<statement>')
  .requiredOption('-p, --planet <planet>')
  .option('--curve')
  .option('--grid')
  .option('--json')
  .action((statement, opts) => {
    const result = generateSigil(statement, opts.planet, opts);
    process.stdout.write(opts.json ? toJSON(result) : toSVG(result, opts));
  });
```

## Data Flow

### Primary Flow (statement → SVG/JSON)

```
statement (string)
    │  normalize()  — strike vowels, strike repeats, keep first occurrence
    ▼
lettersKept (string[])
    │  toPythagoreanDigit() per letter — static table lookup
    ▼
numbers (number[], each 1–9)
    │  cellForNumber(planet, n) per number — static kamea lookup
    ▼
cells ({row,col}[])
    │  buildPath(numbers, cells, planet) — geometry + repeat-loop/start/end tagging
    ▼
PathModel (plain object: points, segments, start, end, gridSize)
    │
    ├──▶ toSVG(PathModel, options) ──▶ SVG string (layers assembled per options)
    │
    └──▶ toJSON({statement, lettersKept, numbers, planet, path}) ──▶ JSON working
```

### Key Data Flows

1. **Statement-to-SVG (the primary use case):** Fully synchronous, single-threaded, no I/O until the CLI's final `process.stdout.write` or `fs.writeFile`. The library function itself performs zero I/O — this is what makes it embeddable in a build pipeline without side effects.
2. **Statement-to-JSON (the audit trail):** Shares every stage with flow 1 up through PathModel; diverges only at the final serialization step. Both outputs are derivable from one `generateSigil()` call — a consumer wanting both SVG and JSON for the same statement should call `generateSigil()` once and pass the result to both renderers, not call the pipeline twice.
3. **Grid/glyph layers (static, path-independent):** The grid layer and planetary glyph layer only need `planet` (for grid size + which cells hold 1–9, and for the glyph lookup) — they do not depend on PathModel at all. They can be rendered from `data/kamea.js` and `data/glyphs.js` directly, in parallel with the path-dependent layers, and composed together in `render/svg.js`.

## Scaling Considerations

This is a deterministic, single-invocation generator — not a service with concurrent-user load. "Scaling" here means *scaling the domain surface*, not request throughput.

| Concern | Now (7 planets, v1) | Later (more path styles) | Later (hosted/UI wrapper, explicitly out of scope for v1) |
|---------|----------------------|---------------------------|--------------------------------------------------------------|
| Kamea data | 7 static squares, max 9×9 | No change — geometry work happens in `path/`, not `data/` | No change to core; a web app would be a new consumer of `src/index.js`, same as the CLI |
| Rendering | Straight/curved toggle in `render/svg.js` | New render options (e.g. dashed, animated stroke-dasharray) added as new layer functions, not new pipeline stages | A `<sigil-spinner>` web component (explicitly deferred) would wrap `toSVG()` output — no core changes needed if the boundary above is honored |
| Output size | Trivial — at most ~81 grid cells, single path | No meaningful growth vector | N/A |

### Scaling Priorities

1. **Correctness first, not performance.** The only real "scale" risk is *scope* — someone adding an eighth "planet" or a non-Agrippa kamea variant later. The `data/kamea.js` boundary is deliberately narrow so that's a data-only change, not a pipeline change (PROJECT.md already scopes this out for v1, but the architecture should not make it structurally painful later).
2. **Render option growth.** As more SVG toggles get requested (glow filters, animation, alternate marker styles), the risk is `render/svg.js` becoming a monolith of conditionals. The per-layer split (Pattern in Project Structure above) is the mitigation — new options should mean new/modified layer functions, not new branches threaded through one giant template.

## Anti-Patterns

### Anti-Pattern 1: Building SVG Strings Inside the Path Builder

**What people do:** Fold geometry and markup together — e.g. `buildPath()` returns an SVG `<path d="...">` string directly, "since we need it anyway."
**Why it's wrong:** Breaks the JSON "working" requirement (JSON would have to parse SVG back out, or duplicate the geometry computation), and makes curve-vs-straight a second code path through path logic instead of a render-time decision. Also makes path logic untestable without string-diffing SVG output.
**Do this instead:** `buildPath()` returns the plain PathModel object described above. SVG and JSON renderers both consume it independently.

### Anti-Pattern 2: Kamea Cell Positions Hardcoded Outside `data/kamea.js`

**What people do:** Inline a planet's square (or a subset of its 1–9 cell positions) directly into the path builder or the grid renderer "just for this one planet," because it's convenient at the call site.
**Why it's wrong:** Creates multiple sources of truth for canonical data where correctness is explicitly a hard project constraint. A transcription error in a duplicated square is now two bugs to find, not one.
**Do this instead:** Every consumer of kamea geometry calls `cellForNumber(planet, n)` / `gridSize(planet)` from `data/kamea.js`. No other file contains square literals.

### Anti-Pattern 3: CLI-Only Validation

**What people do:** Put "planet must be one of the seven classical planets" or similar guard logic in the CLI's argument parser (e.g. commander's `.choices([...])`) and skip it in the library function, since "the CLI already checked."
**Why it's wrong:** The library is a first-class consumer surface (PROJECT.md: "primary consumer is Claude Code... importable as a JS library with the same capabilities"). A programmatic caller that skips the CLI gets undefined behavior on bad input — most likely a confusing downstream `undefined` from the kamea lookup rather than a clear error.
**Do this instead:** Validation lives in the library (`data/kamea.js` or `generate.js` throws on unknown planet); the CLI's `.choices()` (if used) is a UX nicety for shell completion/help text, not the source of correctness.

### Anti-Pattern 4: Mutable Shared Options Object Threaded Through the Pipeline

**What people do:** Pass one big mutable `options`/`context` object into every stage and let each stage read and write fields on it as a way to pass data forward.
**Why it's wrong:** Undermines the determinism guarantee that's explicit in PROJECT.md ("same statement + planet + options → identical sigil") — mutable shared state is exactly the kind of thing that produces order-dependent bugs and makes stages impossible to test in isolation.
**Do this instead:** Each stage takes exactly the inputs it needs and returns a new value. The orchestrator (`generate.js`) is the only place that "remembers" prior stage outputs, and it does so by holding them in local variables / a returned result object — not by mutating a passed-around context.

## Integration Points

### External Services

None. PROJECT.md is explicit: no runtime dependencies for the embed artifact, self-contained SVG, no external refs. This is a pure computation library — there are no integration points to a database, API, or external service in v1.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `text/` ↔ `data/pythagorean.js` | Direct function call (`toPythagoreanDigit(letter)`) | `text/` produces letters; encoding is a separate concern applied by the orchestrator, not inside `normalize()` — keeps letter-stripping testable independent of the numeric table. |
| `path/` ↔ `data/kamea.js` | Direct function call (`cellForNumber`, `gridSize`) | One-directional: `path/` depends on `data/kamea.js`; `data/kamea.js` has zero knowledge of paths, sequences, or sigils. |
| `render/svg.js` ↔ `path/` output | Consumes the PathModel value only | No back-reference — the renderer never calls back into `path/` or `data/`, it only reads the object it was handed (plus `data/glyphs.js` directly for the optional glyph layer, and `data/kamea.js` directly for the optional grid layer). |
| `generate.js` ↔ everything | Direct function calls, orchestration only | The single place allowed to import across `text/`, `data/`, and `path/`. Enforce this as a lint/review rule (e.g. "no cross-imports between `text/`, `path/`, and `render/` — only `generate.js`/`index.js` may import from more than one of `data/`, `text/`, `path/`") so the boundaries above don't erode over time. |
| `bin/cli.js` ↔ `src/index.js` | Direct function call (`generateSigil`, `toSVG`, `toJSON` exported from `index.js`) | CLI imports only the public entry point, never reaches into internal modules. This is what `package.json`'s `exports` field should also enforce for external consumers — export only `index.js`, not internal paths. |

## Sources

- [NodeJS CLI with Commander.js — Medium](https://medium.com/@itsbetma/nodejs-cli-with-commander-js-4a3dda486e9e) — confirms the standard thin-CLI-over-exported-handlers pattern (HIGH confidence — matches well-established, widely-replicated Node CLI convention; commander itself is a de facto standard with ~200M weekly downloads).
- [Crafting Robust Node.js CLIs with oclif and Commander.js — Leapcell](https://leapcell.io/blog/crafting-robust-node-js-clis-with-oclif-and-commander-js) — confirms commander is the right default for focused single/few-command tools (vs. oclif for large multi-command CLIs with plugin systems); Sigil Spinner's CLI surface (one statement + one planet + a handful of flags) fits the commander case, not the oclif case.
- General Node.js SVG-generation guidance (template-literal string building, no DOM dependency needed for server-side SVG) — confirms the "no runtime dependencies for the embed artifact" constraint from PROJECT.md is not just achievable but the *standard* approach for server-side SVG generation, not a workaround (MEDIUM confidence — general web guidance, not sigil-domain-specific, but directly applicable and uncontroversial).
- PROJECT.md (`/Users/falkensmage/RitualSync/sigil-spinner/.planning/PROJECT.md`) — source of truth for the seven kamea dimensions, direct 1–9 cell mapping decision, determinism requirement, and CLI/library scope boundary. Treated as HIGH confidence / authoritative for this project (project-specific decisions, not researched claims).

---
*Architecture research for: text-transform → geometry → SVG generation pipeline, dual CLI/library Node package*
*Researched: 2026-08-04*
