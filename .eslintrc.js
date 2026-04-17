module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'security'],
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'off',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-unsafe-regex': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Forbid outbound links/redirects from the AppShell into the retired
      // /vendor/dashboard (v1) surface. Imports are allowed so we can continue
      // to wrap legacy components until they're physically relocated.
      //
      // Escape hatch: add `// eslint-disable-next-line no-restricted-syntax`
      // with a short rationale if a specific call-site intentionally forwards
      // to v1 (e.g. AppShell-disabled fallback in layout.tsx).
      files: ['app/vendor/(app)/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "Literal[value=/^\\/vendor\\/dashboard(\\/|$|\\?|#)/]",
            message:
              'Do not link from inside the AppShell to /vendor/dashboard (v1). Use the AppShell-native route (e.g. /vendor/studio, /vendor/profile/edit). If this is the AppShell-disabled fallback, target /vendor/legacy instead.',
          },
          {
            selector:
              "TemplateElement[value.raw=/^\\/vendor\\/dashboard(\\/|$|\\?|#)/]",
            message:
              'Do not link from inside the AppShell to /vendor/dashboard (v1). Use the AppShell-native route.',
          },
        ],
      },
    },
  ],
};
