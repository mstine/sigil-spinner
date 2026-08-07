# API Coverage — Phase 3: Themeable, Embeddable Layers

No external API integration: this phase adds SVG render layers (grid, glyph, curve), a CSS custom-property surface, and an `idPrefix` option to an offline, zero-dependency string generator — it makes no network calls and consumes no external service, SDK, or endpoint.

## Why the detector fired (false positive, confirmed by re-reading the phase scope)

The `plan:pre` detector returned `detected: false` when run over the ROADMAP section and CONTEXT.md at plan time. It returns `detected: true` at `verify:pre` because it now scans the PLAN bodies, where two trigger terms appear in **geometry prose**, not integration prose:

| Term | Where it appears | What it actually means |
|---|---|---|
| `connecting` | `03-03-PLAN.md:193` — "both control points strictly between the two endpoints on the **connecting** line" | The straight line joining two kamea cell centres. Geometry. |
| `endpoints` | `03-03-PLAN.md:343`, `:395` — "checks emitted control points and **endpoints**" | Bézier curve endpoints. Geometry. |

## Evidence there is no external API surface to enumerate

- `package.json` → `dependencies: {}` and `optionalDependencies: {}`. The zero-runtime-dependency rule is a hard project constraint in `.claude/CLAUDE.md`, and this phase installed nothing.
- No `fetch(`, no `node:http`/`node:https`, no socket, no WebSocket, no HTTP client anywhere in `src/` or `bin/`. The only `://` string in the codebase is the SVG namespace literal `http://www.w3.org/2000/svg`, which is an XML namespace identifier and is never dereferenced.
- The tool's entire I/O surface is: read a statement from argv or stdin, write an SVG or JSON string to stdout or to a `--output` path. That is the complete boundary.

Per the api-coverage capability's own documented handling — "if `detected` is `true` but the phase genuinely integrates no external API … do NOT fabricate a matrix row for a capability that does not exist" — this reasoned declaration stands in place of a capability matrix. Fabricating INTEGRATE/OPT-OUT rows for a nonexistent API would be worse than useless: it would assert a decided surface where there is nothing to decide.
