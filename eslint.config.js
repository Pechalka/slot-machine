const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/.vite',
      '**/coverage',
      '**/vite.config.js', // если хотим игнорировать
    ],
  },
  // === Для всех .js файлов (клиент, сервер, конфиги) ===
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // можно оставить module, т.к. vite.config.js использует import/export
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off', // или ['warn', { allow: ['warn', 'error'] }]
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // === Для .jsx файлов (только если они есть) подключаем React и Babel ===
  {
    files: ['**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
    },
    rules: {
      ...require('eslint-plugin-react').configs.recommended.rules,
      ...require('eslint-plugin-react').configs['jsx-runtime'].rules,
      ...require('eslint-plugin-react-hooks').configs.recommended.rules,
      ...require('eslint-plugin-jsx-a11y').configs.recommended.rules,
      'react/prop-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  prettier, // отключаем конфликтующие правила
];
