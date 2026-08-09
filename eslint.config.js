// Flat ESLint config (ESLint 10) for this ESM-only, dependency-free package.
// No @eslint/js "recommended" preset is pulled in — the Package Legitimacy
// Audit in 01-RESEARCH.md gated exactly five dev dependencies (vitest,
// typescript, @types/node, eslint, prettier); adding another package here
// would sidestep that gate. Core hygiene rules are declared explicitly
// instead.
export default [
  {
    files: ['src/**/*.js', 'bin/**/*.js', 'test/**/*.js', 'scripts/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
    },
  },
  {
    // Browser globals for the one test file that drives a real browser engine.
    // Code inside `page.evaluate(...)` is serialized and executed in the PAGE's
    // context, not in Node — `document` and `getComputedStyle` are genuinely
    // defined there. Scoped to this directory rather than disabled inline, so a
    // stray `document` reference anywhere else in the repo still fails.
    files: ['test/browser/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        getComputedStyle: 'readonly',
        customElements: 'readonly',
        window: 'readonly',
        MutationObserver: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
