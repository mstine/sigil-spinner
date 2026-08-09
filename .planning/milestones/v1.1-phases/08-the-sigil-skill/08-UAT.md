---
status: passed
phase: 08-the-sigil-skill
source: [08-VERIFICATION.md]
started: 2026-08-09T15:35:00Z
updated: 2026-08-09T15:52:00Z
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
awaiting: nothing — run 2026-08-09, all four conditions PASS

## Tests

### 1. Cold-session routing and reasoning check

expected: All four pass conditions above hold when `skill/VERIFY.md` Procedure 1 is run exactly as written.
result: PASS — run by Matt 2026-08-09, Claude Code 2.1.226, from a scratch directory in a brand-new session opened after `npm run skill:install -- --force`.

| # | Condition | Result |
|---|-----------|--------|
| 1 | Skill fired unprompted | PASS |
| 2 | Correct sigil produced | PASS |
| 3 | Planet chosen with reasoning stated | PASS |
| 4 | No flag or package name from the user at any point | PASS |

Condition 4 is carried by the fact that **only the two verbatim prompts were typed** — no follow-up turn supplied a tool name, package name, or flag. That is the distinction between conditions 1 and 4: 1 covers the opening request, 4 covers the whole exchange, and a run can satisfy 1-3 while being quietly rescued in turn three. It was not.

**Preconditions that will silently invalidate the result if skipped** — from `skill/VERIFY.md`:

- The skill must already be installed (`npm run skill:install`, or `-- --force` to refresh), run from a session **other** than the one being checked.
- The checking session must be a **brand-new Claude Code session opened after that install completed**. Claude Code does not pick up the first-ever creation of a top-level skills directory in an already-running session. Testing in this session, or any session open before `~/.claude/skills/sigil/` first existed, produces a false "the skill never fired" that says nothing about the skill.
- The working directory must be a scratch directory outside this repository (`mktemp -d`), with no `node_modules`.

**Why no automated proxy exists (D-119):** skill routing is a property of the live agent's own request-to-skill matching. Any subagent spawned from a session that has already loaded this repo's context inherits it and proves nothing about a cold session. Every executor in this phase correctly declined to self-certify it; so did the verifier.

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None. The behavior has now been observed: a cold session, in a scratch directory, routed to the skill from ordinary phrasing and chose a planet with stated reasoning, with nothing supplied by the user beyond the two fixed prompts. This is the one claim in the phase that no test, agent, or subagent could honestly certify — every executor and the verifier correctly declined to. It is now carried by an actual observation, recorded with its date, version, and preconditions in `skill/VERIFY.md`.
