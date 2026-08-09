import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Package-identity drift guard (PKG-04, D-65, 06-01-PLAN.md).
 *
 * Reads the package name from `package.json` (the source of truth — never
 * restated as a literal here, per the D-55/D-61 "guards are keyed, not
 * transcribed" precedent) and asserts the README's documented `npm install`
 * command and library `import` example both resolve to that exact name.
 * A drift between the manifest and the docs fails here, on whoever
 * introduces it, rather than surfacing as a broken copy-paste for a new
 * consumer reading the npm package page.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const packageJson = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf-8');

describe('Package identity (PKG-04, D-65)', () => {
  it('documents an npm install command matching package.json name', () => {
    const match = readme.match(/npm install ([^\s`]+)/);
    expect(match, 'README does not contain an `npm install <name>` command').not.toBeNull();
    const installedName = match?.[1];
    expect(
      installedName,
      `README's documented install command names "${installedName}", but package.json's name is "${packageJson.name}"`,
    ).toBe(packageJson.name);
  });

  it('documents a library import specifier matching package.json name', () => {
    const match = readme.match(/import\s*\{[^}]*\}\s*from\s*'([^']+)'/);
    expect(match, 'README does not contain an ESM import example').not.toBeNull();
    const importedSpecifier = match?.[1];
    expect(
      importedSpecifier,
      `README's documented import specifier is "${importedSpecifier}", but package.json's name is "${packageJson.name}"`,
    ).toBe(packageJson.name);
  });
});
