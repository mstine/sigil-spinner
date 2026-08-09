import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { describe, expect, it } from 'vitest';

/**
 * The only test in this suite that resolves the package from OUTSIDE its own
 * boundary. Every other test imports directly from `src/`, where `exports`
 * resolution never applies — a broken `exports` map or a missing `files`
 * entry is invisible to all of them and visible only here (D-70).
 *
 * Rung 1 asserts the `npm pack --dry-run` manifest: it ships `LICENSE` and
 * nothing outside the declared allowlist (D-70). Rung 2 packs a real
 * tarball, installs it into a disposable scratch project, and proves
 * `exports` resolution, the installed `bin`, and byte-identical output
 * against the dev tree — all from a vantage point outside the package
 * (D-70, D-72). The scratch directory is removed on success and preserved
 * on failure so a resolution fault stays diagnosable (D-73).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const packageJson = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
const PACKAGE_NAME = packageJson.name;

const STATEMENT = 'I WILL SUCCEED';
const PLANET = 'saturn';

// D-72: entry points under test are declared as data, not procedure — a new
// exports subpath is a new row here, not a control-flow edit.
/**
 * @typedef {{ subpath: string, namedExports?: string[], resolveOnly?: boolean }} EntryPointRow
 */

/** @type {EntryPointRow[]} */
const ENTRY_POINTS = [
  {
    subpath: '.',
    namedExports: [
      'generateSigil',
      'SigilError',
      'E_EMPTY_SEQUENCE',
      'E_UNKNOWN_PLANET',
      'E_MISSING_STATEMENT',
      'E_MISSING_PLANET',
      'E_INVALID_OPTION',
    ],
  },
  // D-96: `./element` is resolve-only — `class extends HTMLElement`
  // dereferences an undefined global at class-definition time, so a probe
  // that `import`s (and therefore evaluates) the specifier would throw
  // `ReferenceError: HTMLElement is not defined` in Node against a
  // CORRECTLY published package. `resolveOnly: true` steers the probe
  // generator below to a resolve-and-check-existence body instead of the
  // import-and-evaluate body every other row gets. Evaluation and
  // registration are `test/browser/element.test.js`'s job — two vantage
  // points, deliberately not collapsed.
  {
    subpath: './element',
    resolveOnly: true,
  },
];

const EXPECTED_TARBALL_FILES = [
  'package.json',
  'README.md',
  'LICENSE',
  'src/index.js',
  'bin/sigil-spinner.js',
  'src/element/sigil-spinner-element.js',
];

// The prefix allowlist every manifest path must satisfy: the three exact
// filenames, plus the two directory prefixes (trailing slash is the marker).
const ALLOWED_TARBALL_ROOTS = ['package.json', 'README.md', 'LICENSE', 'src/', 'bin/'];

/** @param {string} candidatePath */
function isAllowedTarballPath(candidatePath) {
  return ALLOWED_TARBALL_ROOTS.some((root) =>
    root.endsWith('/') ? candidatePath.startsWith(root) : candidatePath === root,
  );
}

/**
 * Fails loudly (never skips) when npm itself is missing from PATH.
 * @param {string[]} args
 * @param {{ cwd: string }} options
 */
function runNpm(args, options) {
  try {
    return execFileSync('npm', args, { encoding: 'utf-8', ...options });
  } catch (/** @type {any} */ err) {
    if (err instanceof Error && /** @type {any} */ (err).code === 'ENOENT') {
      throw new Error(`npm is not on PATH — cannot run 'npm ${args.join(' ')}': ${err.message}`);
    }
    throw err;
  }
}

/**
 * Normalizes `npm pack --dry-run --json` output to a flat array of tarball
 * path strings. On this repo's npm (11.4.2, confirmed live) the output is an
 * array whose first element carries a `files` array of `{ path }` objects —
 * but npm 12 changed this to an object keyed by package id, so both shapes
 * are handled rather than indexed blindly.
 * @param {any} parsed
 * @returns {string[]}
 */
function normalizeManifestPaths(parsed) {
  if (Array.isArray(parsed)) {
    return parsed.flatMap((entry) => (entry.files ?? []).map((/** @type {any} */ file) => file.path));
  }
  if (parsed && typeof parsed === 'object') {
    return Object.values(parsed).flatMap((entry) =>
      (/** @type {any} */ (entry).files ?? []).map((/** @type {any} */ file) => file.path),
    );
  }
  throw new Error(`unrecognized npm pack --json output shape: ${JSON.stringify(parsed)}`);
}

describe('pack-and-scratch-install smoke test (PKG-03)', () => {
  it('rung 1 — the npm pack --dry-run manifest ships LICENSE and nothing outside the allowlist (D-70)', () => {
    const raw = runNpm(['pack', '--dry-run', '--json'], { cwd: REPO_ROOT });
    const manifestPaths = normalizeManifestPaths(JSON.parse(raw));

    for (const expected of EXPECTED_TARBALL_FILES) {
      expect(manifestPaths, `expected '${expected}' in the tarball manifest`).toContain(expected);
    }

    const offending = manifestPaths.filter((candidate) => !isAllowedTarballPath(candidate));
    expect(
      offending,
      `tarball manifest ships paths outside the allowlist: ${offending.join(', ')}`,
    ).toEqual([]);

    // D-95: examples/element.html is repo-only, deliberately never added to
    // `files` — a future `files` edit that swept it in should fail here
    // rather than silently expanding the published tarball surface.
    const examplesPaths = manifestPaths.filter((candidate) => candidate.startsWith('examples/'));
    expect(
      examplesPaths,
      `tarball manifest ships paths under 'examples/', which is repo-only (D-95): ${examplesPaths.join(', ')}`,
    ).toEqual([]);
  });

  it('rung 2 — a real tarball installs into a scratch project and resolves from outside the package (D-70, D-72, D-73)', () => {
    const scratchDir = mkdtempSync(path.join(os.tmpdir(), 'sigil-spinner-pack-'));

    try {
      const packRaw = runNpm(['pack', '--pack-destination', scratchDir, '--json'], {
        cwd: REPO_ROOT,
      });
      const packResult = JSON.parse(packRaw);
      const packEntry = Array.isArray(packResult) ? packResult[0] : Object.values(packResult)[0];
      if (!packEntry || !packEntry.filename) {
        throw new Error('npm pack produced no tarball filename');
      }
      const tarballPath = path.join(scratchDir, packEntry.filename);

      const projectDir = path.join(scratchDir, 'project');
      mkdirSync(projectDir);
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'sigil-spinner-pack-scratch-consumer', private: true }, null, 2),
      );
      execFileSync(
        'npm',
        ['install', tarballPath, '--no-audit', '--no-fund', '--ignore-scripts'],
        { cwd: projectDir, encoding: 'utf-8' },
      );

      // Assertion 1: zero transitive runtime dependencies in the installed copy.
      const nodeModulesDir = path.join(projectDir, 'node_modules');
      const topLevelEntries = readdirSync(nodeModulesDir).filter(
        (entry) => entry !== '.bin' && !entry.startsWith('.'),
      );
      expect(topLevelEntries).toEqual(['@falkensmage']);
      const scopedEntries = readdirSync(path.join(nodeModulesDir, '@falkensmage'));
      expect(scopedEntries).toEqual(['sigil-spinner']);

      // Assertion 2: `exports` resolves for every declared entry point, from
      // a plain `.mjs` probe outside the package — the vantage point every
      // other test in the suite structurally cannot reach.
      for (const entry of ENTRY_POINTS) {
        const specifier =
          entry.subpath === '.' ? PACKAGE_NAME : `${PACKAGE_NAME}${entry.subpath.slice(1)}`;
        const probePath = path.join(
          projectDir,
          `probe-${entry.subpath.replace(/[^a-z0-9]/gi, '_')}.mjs`,
        );

        if (entry.resolveOnly) {
          // D-96: resolve `specifier` through `exports` and confirm the
          // resolved file actually exists in the installed tree — never
          // `import` (and thereby evaluate) the specifier itself. The
          // element module dereferences `HTMLElement` at class-definition
          // time, which throws `ReferenceError` in Node for a CORRECTLY
          // published package; evaluation is `test/browser/element.test.js`'s
          // job, not this test's. `import.meta.resolve()` alone is not
          // sufficient proof: since Node 20.6.0 it no longer throws for a
          // `file:` target that doesn't exist on disk, so resolution
          // success alone cannot prove the file shipped — `existsSync`
          // closes that gap.
          const resolveOnlyProbeSource = [
            "import { existsSync } from 'node:fs';",
            "import { fileURLToPath } from 'node:url';",
            '',
            'let resolvedUrl;',
            'try {',
            `  resolvedUrl = import.meta.resolve(${JSON.stringify(specifier)});`,
            '} catch (err) {',
            `  throw new Error(\`exports subpath '${entry.subpath}' did not resolve: \${err.message}\`);`,
            '}',
            '',
            'const resolvedPath = fileURLToPath(resolvedUrl);',
            'if (!existsSync(resolvedPath)) {',
            `  throw new Error(\`${entry.subpath} resolved to \${resolvedPath}, but that file does not exist on disk\`);`,
            '}',
            "process.stdout.write('OK');",
          ].join('\n');
          writeFileSync(probePath, resolveOnlyProbeSource, 'utf-8');

          const resolveOnlyOutput = execFileSync(process.execPath, [probePath], {
            cwd: projectDir,
            encoding: 'utf-8',
          });
          expect(resolveOnlyOutput).toContain('OK');
          continue;
        }

        if (!entry.namedExports) {
          throw new Error(
            `ENTRY_POINTS row for '${entry.subpath}' has no namedExports and is not resolveOnly`,
          );
        }
        const bindingNames = entry.namedExports.join(', ');
        const callsGenerateSigil = entry.namedExports.includes('generateSigil');
        const probeSource = [
          `import { ${bindingNames} } from '${specifier}';`,
          `const bindings = { ${bindingNames} };`,
          'for (const [name, value] of Object.entries(bindings)) {',
          "  if (value === undefined) {",
          "    throw new Error('expected named export ' + name + ' to be defined');",
          '  }',
          '}',
          callsGenerateSigil
            ? `const { svg } = generateSigil(${JSON.stringify(STATEMENT)}, ${JSON.stringify(PLANET)});\nprocess.stdout.write(svg);`
            : '',
        ].join('\n');
        writeFileSync(probePath, probeSource, 'utf-8');

        const probeOutput = execFileSync(process.execPath, [probePath], {
          cwd: projectDir,
          encoding: 'utf-8',
        });
        if (callsGenerateSigil) {
          expect(probeOutput).toContain('<svg');
        }
      }

      // Assertion 3: the installed bin runs end to end and matches the dev
      // tree's CLI output byte for byte — comparing installed-against-dev,
      // never against a committed snapshot, so a stale or partial installed
      // tree cannot pass by coincidence.
      const installedBinPath = path.join(nodeModulesDir, '.bin', 'sigil-spinner');
      const installedOutput = execFileSync(
        process.execPath,
        [installedBinPath, STATEMENT, '--planet', PLANET],
        { encoding: 'utf-8' },
      );
      const devCliPath = path.join(REPO_ROOT, 'bin', 'sigil-spinner.js');
      const devOutput = execFileSync(process.execPath, [devCliPath, STATEMENT, '--planet', PLANET], {
        encoding: 'utf-8',
      });
      expect(installedOutput).toBe(devOutput);

      // Only reached if every assertion above passed — D-73 cleanup on success.
      rmSync(scratchDir, { recursive: true, force: true });
    } catch (/** @type {any} */ err) {
      // D-73: preserve the scratch directory on failure so an `exports`
      // resolution fault stays diagnosable after the fact.
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `pack-install smoke test failed; scratch directory preserved at ${scratchDir} for diagnosis: ${message}`,
      );
    }
  });
});
