import { defineConfig } from 'vitest/config';

// D-71 / Assumption A1 (closed by observation, 06-RESEARCH.md): a `vitest
// run <path>` CLI argument does NOT override a config-level `test.exclude`
// entry for that same file — running `vitest run test/pack-install.test.js`
// against the main vitest.config.js prints "No test files found, exiting
// with code 1" rather than running the file. A dedicated config scoped to
// only this file is the fallback the plan names for exactly this case.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/pack-install.test.js'],
  },
});
