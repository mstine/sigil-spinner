# Verifying the Sigil Skill

This file is the instrument the phase's two un-automatable success criteria are performed with — not documentation about them. There is no honest automated substitute for either. A subagent spawned from the session that authored this skill inherits that session's context and would prove nothing about whether a genuinely cold session routes to the skill on its own. A test asserting `SKILL.md`'s `description` contains certain substrings proves the file's contents, not that a model actually routes to it from an unprompted request. The two procedures below are run by a human, on a real machine, and their prompts are written here verbatim so the check is repeatable rather than re-improvised on every run.

## Procedure 1 — Cold-Session Routing and Reasoning (Success Criterion 1)

What this proves: a Claude Code session that has never seen this repository generates and embeds a correct sigil, picking the planet with stated reasoning, without the user naming the tool, the package, or a flag.

### Preconditions

Get these wrong and the check produces a false negative that reads exactly like a real failure — read this section before running anything.

1. **The skill must already be installed**, from a session other than the one being checked. Run `npm run skill:install` (or `npm run skill:install -- --force` if the installed copy at `~/.claude/skills/sigil/` already exists and needs to pick up the latest repo content) from this repository's normal working session — not from the session you are about to test.
2. **The checking session must be a brand-new Claude Code session, opened after that install completed.** Claude Code watches its top-level skills directories for changes, but a top-level directory that did not exist when a session started is not picked up by that already-running session — only a session started afterward sees it. Live edits to an already-watched skill directory are picked up without a restart; the *first-ever creation* of `~/.claude/skills/sigil/` is not. Running this check in the same session that just ran the install, or in any session that was already open before the skill directory first existed, will produce a false "the skill never fired" result that has nothing to do with the skill itself.
3. **The working directory must be a scratch directory** — not this repository, and not any directory with an installed `node_modules` that happens to include this package. `mktemp -d` and `cd` into it before opening the checking session.

### Prompts

Type these exactly as written. Do not modify them, and do not supply the tool name, the package name, or any flag at any point in the exchange — that is the thing being tested.

**Prompt 1:**

> make me a sigil for 'I WILL FINISH THIS'

**Prompt 2:**

> I need a sigil for a page about letting go of an old job — pick the planet.

### Pass conditions

All four are required. Record each one separately — a partial pass is a fail, recorded as such.

| # | Condition |
|---|-----------|
| 1 | The skill fired unprompted — nothing in either prompt named the tool, the package, or a flag, and the session still produced sigil output. |
| 2 | A correct sigil was produced — valid SVG, traced from the stated statement on a real planet's kamea. |
| 3 | A planet was chosen **with the reasoning stated in the reply** — not a bare planet name, and not a question bounced back to the user asking which planet to use. |
| 4 | No flag or package name came from the user at any point in the exchange. |

**If the planet correspondences have not yet been ratified by Matt** (the `<!-- SKILL-02 pending -->` marker is still present in `skill/SKILL.md`'s Planet Selection section), condition 3 is *expected* to fail — the `description` frontmatter is deliberately written narrow in that case so it does not promise reasoning the body cannot deliver. Record that as the expected outcome, not as a defect to chase.

### Results

Fill in on each run:

```
Date:                                  2026-08-09
Claude Code version:                   2.1.226
Condition 1 (fired unprompted):        PASS
Condition 2 (correct sigil):           PASS
Condition 3 (planet + reasoning):      PASS
Condition 4 (no tool/package/flag):    PASS
Notes: Run by Matt from a scratch directory outside the repository, in a
       brand-new session opened after `npm run skill:install -- --force`.
       Both prompts typed verbatim; nothing beyond the two prompts was
       supplied at any point in the exchange, which is what carries
       condition 4. First run of this procedure; correspondences had been
       ratified earlier the same day, so the note under Pass Conditions
       about an unratified table did not apply.
```

## Procedure 2 — Live Registry Invocation (Success Criterion 3)

What this proves: the exact invocation string the skill tells a session to type runs successfully against the *published* package, resolved through the real npm registry — not against a local checkout that only works on this machine, and not against a pack-and-install tarball, which is a different claim (that path is `test/pack-install.test.js`'s job, proving the tarball's contents are correct, not that the registry and `npx` resolution work end to end).

### Procedure

From a scratch directory outside this repository (`mktemp -d`, no relationship to this checkout, no local `package.json`):

1. Run the exact string `skill/SKILL.md`'s Invocation section documents, unmodified:

   ```bash
   npx -y @falkensmage/sigil-spinner@latest '<statement>' --planet <planet>
   ```

   substituting a real statement and a real planet — do not substitute this repository's own local entry point in place of the package specifier; the claim under test is specifically that the registry resolves and `npx` runs the published artifact, not that the source tree in this checkout works.

2. Capture four things: the version the registry currently resolves `@latest` to (`npm view @falkensmage/sigil-spinner version`), the process's exit status, the first bytes of stdout, and the full contents of stderr.

### Pass condition

Exit status `0`, stdout beginning with an SVG root element (`<svg xmlns=...`), and empty stderr.

### Error-case sanity anchor

Run these two as well — not because they need to pass, but because their output is the reason the skill's embedding checklist does not duplicate error-recovery guidance. The library's own diagnostics are already self-explanatory:

```bash
npx -y @falkensmage/sigil-spinner@latest 'test' --planet pluto
# E_UNKNOWN_PLANET: ... unknown planet "pluto". Valid planets: saturn, jupiter, mars, sun, venus, mercury, moon
# exit 2

npx -y @falkensmage/sigil-spinner@latest --planet saturn
# E_MISSING_STATEMENT: ... statement is required and must be a non-empty string, got: undefined
# exit 2
```

An unknown planet names all seven valid planets in its own message; a missing statement names the missing field in its own message. Both exit `2`. A session that hits either error already has what it needs from stderr alone.

### Results

Fill in on each run:

```
Date:
Registry-resolved version (npm view @falkensmage/sigil-spinner version):
Exit status:
First 300 bytes of stdout:
stderr (verbatim, or "empty"):
Result:                                 PASS / FAIL
```

## After Running Either Procedure

If this file changed (a new run, a corrected prompt, an updated results block), reinstall so the destination carries the current content:

```bash
npm run skill:install -- --force
npx vitest run test/skill-install-parity.test.js
```

Confirm the install-parity guard is green before treating either procedure's results as current.
