---
status: testing
phase: 08-the-sigil-skill
source: [08-VERIFICATION.md]
started: 2026-08-09T15:35:00Z
updated: 2026-08-09T15:35:00Z
---

## Current Test

number: 1
name: Cold-session routing and reasoning check (ROADMAP Success Criterion 1 / SKILL-01, D-118/D-119)
expected: |
  All four pass conditions hold, recorded individually:
  1. The skill fired unprompted — you never named the tool, the package, or a flag.
  2. A correct SVG sigil was produced.
  3. A planet was chosen with the reasoning stated in the reply — the planet named, the domain of intent it was matched on, and (if the statement was ambiguous) the axis that decided it and the runner-up.
  4. Nothing was supplied by you at any point — no flag, no package name, no "use sigil-spinner".

  A partial pass counts as a fail.
awaiting: user response

## Tests

### 1. Cold-session routing and reasoning check

expected: All four pass conditions above hold when `skill/VERIFY.md` Procedure 1 is run exactly as written.
result: [pending]

**Preconditions that will silently invalidate the result if skipped** — from `skill/VERIFY.md`:

- The skill must already be installed (`npm run skill:install`, or `-- --force` to refresh), run from a session **other** than the one being checked.
- The checking session must be a **brand-new Claude Code session opened after that install completed**. Claude Code does not pick up the first-ever creation of a top-level skills directory in an already-running session. Testing in this session, or any session open before `~/.claude/skills/sigil/` first existed, produces a false "the skill never fired" that says nothing about the skill.
- The working directory must be a scratch directory outside this repository (`mktemp -d`), with no `node_modules`.

**Why no automated proxy exists (D-119):** skill routing is a property of the live agent's own request-to-skill matching. Any subagent spawned from a session that has already loaded this repo's context inherits it and proves nothing about a cold session. Every executor in this phase correctly declined to self-certify it; so did the verifier.

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

None recorded. Everything that makes the cold-session behavior *possible* is built, wired, and independently reconfirmed — tarball boundary, install parity, drift guard (adversarially re-triggered), ratified correspondences, live registry invocation. The behavior itself has not yet been observed by anyone.
