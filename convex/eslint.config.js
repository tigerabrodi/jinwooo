import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config({
  files: ['**/*.ts'],
  ignores: ['_generated/**'],
  languageOptions: {
    ecmaVersion: 2020,
    parserOptions: {
      project: ['./tsconfig.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
  rules: {
    'no-await-in-loop': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: ['is', 'should', 'has', 'are', 'can', 'was'],
      },
    ],
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
  },
})
