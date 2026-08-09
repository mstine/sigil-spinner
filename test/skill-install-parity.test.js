import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Repo-to-installed byte-identity guard (D-101).
 *
 * Asserts that every file under the personal skill directory
 * (`~/.claude/skills/sigil/`) is byte-identical to its `skill/` repository
 * counterpart, whenever that directory exists. `INSTALLED_ROOT` and
 * `REPO_SKILL_ROOT` are constructed the same way `scripts/skill-install.js`
 * builds its own destination — `os.homedir()` joined with the same fixed
 * path segments — so a change to either side's path construction is
 * visible against the other rather than silently diverging.
 *
 * This is the ONE deliberate, commented exception to this repo's
 * established "fail loudly, never skip" convention (confirmed elsewhere in
 * this suite — `test/browser/*` fails with install instructions rather
 * than skipping when chromium is absent). The two cases are genuinely
 * different: a missing chromium is a missing PREREQUISITE the developer
 * should fix, whereas an absent `~/.claude/skills/sigil/` is the CORRECT
 * STATE on every machine that is not Matt's — this project's own machine
 * is the only one where the install has ever run. Conflating the two would
 * train this suite's red to mean nothing. The no-op branch below always
 * prints why it did nothing, because an unexplained pass is exactly how a
 * guard like this decays into decoration.
 *
 * Following `test/citations.test.js`'s collect-then-report-once
 * discipline: every divergent and orphan path is gathered before the test
 * fails once with the full, stably sorted list, rather than stopping at
 * the first offending path.
 *
 * `vitest.config.js`'s flat `include: ['test/**\/*.test.js']` picks this
 * file up automatically on every developer's `npm test` — which is
 * exactly why the absent-destination branch has to be correct rather than
 * incidental.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const REPO_SKILL_ROOT = path.join(REPO_ROOT, 'skill');
const INSTALLED_ROOT = path.join(os.homedir(), '.claude', 'skills', 'sigil');

/**
 * Recursively list every regular file under `root`, returned as
 * posix-joined paths relative to `root` — mirrors
 * `scripts/skill-install.js`'s own `listFilesRecursive`.
 * @param {string} root
 * @returns {string[]}
 */
function listFilesRecursive(root) {
  /** @type {string[]} */
  const out = [];
  /**
   * @param {string} dir
   * @returns {void}
   */
  function walk(dir) {
    if (!statSync(dir).isDirectory()) {
      throw new Error(
        `E_SKILL_INSTALL: expected a directory at ${dir}, found a non-directory entry`,
      );
    }
    for (const entry of readdirSync(dir)) {
      const abs = path.join(dir, entry);
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        walk(abs);
      } else if (stat.isFile()) {
        out.push(path.relative(root, abs).split(path.sep).join('/'));
      }
    }
  }
  walk(root);
  return out;
}

describe('Skill install-parity guard (D-101)', () => {
  it('the repository skill source tree is non-empty', () => {
    // Unconditional, independent of whether INSTALLED_ROOT exists: without
    // this, an empty or mis-resolved REPO_SKILL_ROOT would make the
    // byte-identity comparison below vacuously true on a machine where the
    // destination does exist — the same class of vacuous-pass defect this
    // project's citation checker (05-04) shipped once and had to repair.
    const repoFiles = listFilesRecursive(REPO_SKILL_ROOT);
    expect(repoFiles.length, `skill/ contains no files at ${REPO_SKILL_ROOT}`).toBeGreaterThan(0);
  });

  it('~/.claude/skills/sigil/ is byte-identical to skill/, file for file, when present', () => {
    if (!existsSync(INSTALLED_ROOT)) {
      console.log(
        `[skill-install-parity] no-op (expected, not a failure): ${INSTALLED_ROOT} does not ` +
          "exist on this machine. This is the correct state on any machine that is not " +
          "Matt's — the guard is a deliberate no-op here rather than a failure, per D-101, " +
          "this suite's one stated exception to fail-loudly-rather-than-skip.",
      );
      return; // explicit, message-printing no-op — the one stated exception
    }

    const repoFiles = listFilesRecursive(REPO_SKILL_ROOT);
    const installedFiles = listFilesRecursive(INSTALLED_ROOT);

    /** @type {string[]} */
    const missing = [];
    /** @type {string[]} */
    const diverged = [];
    for (const relPath of repoFiles) {
      const destPath = path.join(INSTALLED_ROOT, relPath);
      if (!existsSync(destPath)) {
        missing.push(relPath);
        continue;
      }
      const srcContent = readFileSync(path.join(REPO_SKILL_ROOT, relPath));
      const destContent = readFileSync(destPath);
      if (!srcContent.equals(destContent)) {
        diverged.push(relPath);
      }
    }

    /** @type {string[]} */
    const orphans = installedFiles.filter((relPath) => !repoFiles.includes(relPath));

    const findings = [
      ...missing.map((p) => `missing at destination: ${p}`),
      ...diverged.map((p) => `diverged from repository source: ${p}`),
      ...orphans.map((p) => `orphan at destination (no repository counterpart): ${p}`),
    ].sort();

    expect(
      findings,
      `${INSTALLED_ROOT} is not byte-identical to ${REPO_SKILL_ROOT}:\n${findings.join('\n')}`,
    ).toEqual([]);
  });
});
