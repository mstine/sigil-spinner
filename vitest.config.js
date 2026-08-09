import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // D-71: the pack-install smoke test is a build artifact of the repo
    // itself; excluded from the default run and exposed as `npm run
    // test:pack` so the inner loop never pays for a pack plus an install.
    exclude: [...configDefaults.exclude, 'test/pack-install.test.js'],
  },
});
