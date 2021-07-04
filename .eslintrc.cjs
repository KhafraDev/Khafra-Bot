module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    ignorePatterns: ['src/lib/Packages/*/*.ts'],
    parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 99,
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'no-empty': 'off',

        '@typescript-eslint/no-unnecessary-type-assertion': 'warn'
    }
};