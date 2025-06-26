import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typescriptEslint from '@typescript-eslint/eslint-plugin'

export default [
  // Базовые правила из @eslint/js
  js.configs.recommended,

  // Игнорируем папку dist
  {
    ignores: ['dist'],
  },

  // Настройка для TS/TSX
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parser: typescriptEslint.parsers['@typescript-eslint/parser'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: globals.browser,
    },
    rules: {
      // Отключаем запрет non-null assertion (для `document.getElementById('root')!`)
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Рекомендуемые правила TS-ESLint
      ...typescriptEslint.configs.recommended.rules,
      // Рекомендуемые правила React Hooks
      ...reactHooks.configs.recommended.rules,
      // Правило из react-refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
