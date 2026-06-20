import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import n from 'eslint-plugin-n';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'src/models/qwen-tokenizer/**',
      'src/models/tokenizer/**',
    ],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      n,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
];
