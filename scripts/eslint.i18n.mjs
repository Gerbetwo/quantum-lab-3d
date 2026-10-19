import i18next from 'eslint-plugin-i18next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/__tests__/**', 'src/tests/**'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          'should-validate-template': true,
          message: 'Hardcoded UI string. Move it to src/lib/i18n.ts and use t("section.key").',
          onlyAttribute: ['title', 'aria-label', 'aria-description', 'placeholder', 'alt'],
        },
      ],
    },
  },
];
