# API Coverage — Phase 3: Themeable, Embeddable Layers

No external API integration: this phase adds SVG render layers and a CSS custom-property surface to an offline, zero-dependency string generator with no network calls and no external service or SDK.

The full reasoning, and the evidence behind that one-line declaration, follows.

## Why the detector fired, and why it is overruled

The `plan:pre` detector returned `detected: false` over the ROADMAP section and CONTEXT.md at plan time. It returns `detected: true` at `verify:pre` only because it now scans the PLAN bodies, where two trigger terms appear in geometry prose rather than integration prose:

- `connecting` — `03-03-PLAN.md`, "both control points strictly between the two endpoints on the connecting line". This is the straight line joining two kamea cell centres.
- `endpoints` — `03-03-PLAN.md`, "checks emitted control points and endpoints". These are Bezier curve endpoints.

Neither refers to a network endpoint or a service connection.

## Evidence there is no external surface to enumerate

- `package.json` declares `dependencies: {}` and `optionalDependencies: {}`. Zero runtime dependencies is a hard project constraint in `.claude/CLAUDE.md`, and this phase installed nothing.
- There is no `fetch(`, no `node:http` or `node:https`, no socket, no WebSocket, and no HTTP client anywhere in `src/` or `bin/`. The only `://` string in the codebase is the SVG namespace literal for `w3.org/2000/svg`, which is an XML namespace identifier and is never dereferenced.
- The tool's entire I/O surface is: read a statement from argv or stdin; write an SVG or JSON string to stdout or to a `--output` path. That is the complete boundary.

Per the api-coverage capability's own documented handling of an overruled detector, this reasoned declaration stands in place of a capability matrix. Fabricating INTEGRATE and OPT-OUT rows for an API that does not exist would assert a decided surface where there is nothing to decide, which is worse than useless.
