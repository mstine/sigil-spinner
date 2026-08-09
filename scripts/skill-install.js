#!/usr/bin/env node
/**
 * One-directional install: `skill/` (repo-canonical source, D-99) into the
 * personal Claude Code skill directory (`~/.claude/skills/sigil/`). Never
 * the reverse — nothing under the destination is ever written back into
 * the repo (T-08-03).
 *
 * The destination is built from `os.homedir()` plus fixed literal path
 * segments only; it is never taken from argv or an environment variable
 * (T-08-02), so there is no caller-controlled component to traverse with.
 *
 * Two-pass write (T-08-02/T-08-03): every source file is first classified
 * against its destination counterpart as `new`, `identical`, or
 * `divergent`. Only after every file has been classified does any write
 * happen, so a divergence discovered mid-tree can never leave a
 * partially-written destination. If any file is divergent and `--force`
 * was not passed, nothing is written at all — every divergent path is
 * named on stderr and the process exits non-zero. With `--force`, every
 * new or divergent file is written, and every overwritten path is named —
 * a replacement is never silent.
 *
 * Files present at the destination with no repo counterpart are reported
 * as orphans and are never deleted; the install-parity guard
 * (`test/skill-install-parity.test.js`, D-101) is where an orphan turns
 * red.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const REPO_SKILL_ROOT = path.join(REPO_ROOT, 'skill');
const INSTALLED_ROOT = path.join(os.homedir(), '.claude', 'skills', 'sigil');

const FORCE = process.argv.includes('--force');

/**
 * Recursively list every regular file under `root`, returned as
 * posix-joined paths relative to `root` (stable across platforms).
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
      process.stderr.write(
        `E_SKILL_INSTALL: expected a directory at ${dir}, found a non-directory entry\n`,
      );
      process.exit(1);
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

/**
 * @typedef {{ relPath: string, status: 'new' | 'identical' | 'divergent' }} Classification
 */

if (!existsSync(REPO_SKILL_ROOT)) {
  process.stderr.write(`E_SKILL_INSTALL: repo skill source not found at ${REPO_SKILL_ROOT}\n`);
  process.exit(1);
}

const repoFiles = listFilesRecursive(REPO_SKILL_ROOT);

// Report orphans first — informational only, never blocks and never
// deletes. An orphan is a file at the destination with no repo
// counterpart; the install-parity guard (D-101) is what fails on it.
if (existsSync(INSTALLED_ROOT)) {
  const installedFiles = listFilesRecursive(INSTALLED_ROOT);
  const orphans = installedFiles.filter((relPath) => !repoFiles.includes(relPath));
  if (orphans.length > 0) {
    console.log('[skill-install] orphan file(s) at the destination with no repo counterpart (not deleted):');
    for (const relPath of orphans) {
      console.log(`  ${path.join(INSTALLED_ROOT, relPath)}`);
    }
  }
}

/**
 * @param {string} relPath
 * @returns {Classification}
 */
function classify(relPath) {
  const destPath = path.join(INSTALLED_ROOT, relPath);
  if (!existsSync(destPath)) {
    return { relPath, status: 'new' };
  }
  const srcContent = readFileSync(path.join(REPO_SKILL_ROOT, relPath));
  const destContent = readFileSync(destPath);
  return { relPath, status: srcContent.equals(destContent) ? 'identical' : 'divergent' };
}

const classifications = repoFiles.map(classify);

const divergent = classifications.filter((c) => c.status === 'divergent');

if (divergent.length > 0 && !FORCE) {
  process.stderr.write(
    'E_SKILL_INSTALL: the following installed file(s) diverge from their repo counterpart:\n',
  );
  for (const c of divergent) {
    process.stderr.write(`  ${path.join(INSTALLED_ROOT, c.relPath)}\n`);
  }
  process.stderr.write(
    'skill/ is always the source of truth. Nothing was written. Re-run with ' +
      '`npm run skill:install -- --force` to replace the installed copy.\n',
  );
  process.exit(1);
}

const toWrite = classifications.filter(
  (c) => c.status === 'new' || (FORCE && c.status === 'divergent'),
);

if (toWrite.length === 0) {
  console.log(`[skill-install] already up to date — ${INSTALLED_ROOT} matches skill/ exactly.`);
  process.exit(0);
}

for (const c of toWrite) {
  const destPath = path.join(INSTALLED_ROOT, c.relPath);
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, readFileSync(path.join(REPO_SKILL_ROOT, c.relPath)));
  console.log(`[skill-install] ${c.status === 'divergent' ? 'overwrote' : 'wrote'} ${destPath}`);
}

console.log(`[skill-install] installed ${toWrite.length} file(s) to ${INSTALLED_ROOT}`);
