// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const { builtinModules } = require('node:module')

// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: [
    '**/*.d.ts',
    '**/*.js'
  ],
  parserOptions: {
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/tsconfig.base.json'
    ],
    ecmaVersion: 99,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict'
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // style changes
    'quotes': ['error', 'single'],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'eol-last': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'arrow-spacing': 'error',
    'brace-style': 'error',
    'comma-dangle': ['error', 'never'],
    'comma-style': ['error', 'last'],
    'computed-property-spacing': ['error', 'never'],
    'dot-location': ['error', 'property'],
    'func-call-spacing': ['error', 'never'],
    'generator-star-spacing': ['error', { 'before': true, 'after': true }],
    'key-spacing': ['error', { 'beforeColon': false }],
    'keyword-spacing': ['error', { 'before': true }],
    'max-statements-per-line': ['error', { 'max': 1 }],
    'newline-per-chained-call': ['error', { 'ignoreChainWithDepth': 3 }],
    'no-restricted-imports': [2, ...builtinModules.map((m) => ({ name: m, message: `Import node:${m} instead` }))],
    'no-trailing-spaces': 'error',
    'no-whitespace-before-property': 'error',
    '@typescript-eslint/semi': ['error', 'never'],
    'space-before-blocks': 'error',
    'max-len': ['error', { code: 120, ignoreComments: true }],

    'no-empty': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-loss-of-precision': 'error',
    'no-promise-executor-return': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-useless-backreference': 'error',
    'no-restricted-globals': [
      'error',
      'process',
      'Buffer',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'URL',
      'URLSearchParams'
    ],
    'no-console': 'error',

    '@typescript-eslint/no-unused-vars': ['error', { 'varsIgnorePattern': '_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    '@typescript-eslint/member-delimiter-style': ['error', {
      'multiline': {
        'delimiter': 'none'
      },
      'singleline': {
        'delimiter': 'comma'
      }
    }],
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-extra-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
    // '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/prefer-regexp-exec': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off'
  }
}
