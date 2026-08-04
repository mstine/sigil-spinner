// Flat ESLint config (ESLint 10) for this ESM-only, dependency-free package.
// No @eslint/js "recommended" preset is pulled in — the Package Legitimacy
// Audit in 01-RESEARCH.md gated exactly five dev dependencies (vitest,
// typescript, @types/node, eslint, prettier); adding another package here
// would sidestep that gate. Core hygiene rules are declared explicitly
// instead.
export default [
  {
    files: ['src/**/*.js', 'bin/**/*.js', 'test/**/*.js', '*.js'],
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
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
