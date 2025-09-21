import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import parserVue from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import stylistic from '@stylistic/eslint-plugin'
import json from '@eslint/json'
import css from '@eslint/css'
import { defineConfig } from 'eslint/config'

const basePlugins = {
  '@typescript-eslint': tseslint.plugin,
  prettier: prettierPlugin,
}

// Get vue,js,mjs,ts LanguageOptions
function getVueOrTsLanguageOptions(type) {
  const languageOptions = {
    parser: tseslint.parser,
    parserOptions: {
      parser: tseslint.parser,
      project: './tsconfig.json',
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      extraFileExtensions: ['.vue'],
      projectService: true,
    },
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.es2021,
    },
  }
  if (type === 'vue') {
    languageOptions.parser = parserVue
  }
  return languageOptions
}

// set @stylistic rules
function setStylisticRules(_rules) {
  const keys = Object.keys(_rules)
  const rules = {}
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    rules[`@stylistic/${key}`] = _rules[key]
  }
  return rules
}

export default defineConfig([
  {
    // Note: there should be no other properties in this object
    ignores: [
      'dist',
      'node_modules',
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      '.cli.tsconfig/tsconfig.json',
      '.commitlintrc.js',
      '.css.build',
      'postbuild.js',
      'ts-node.js',
      'eslint.config.js'
    ],
  },
  {
    name: 'prettier',
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // https://eslint.org/docs/latest/rules/
      'prettier/prettier': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'grouped-accessor-pairs': ['error', 'setBeforeGet'],
      'block-scoped-var': 'error',
      camelcase: 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      eqeqeq: ['error', 'smart'],
      'no-delete-var': 'error',
      'no-div-regex': 'error',
      'no-extend-native': 'warn',
      'no-extra-bind': 'error',
      'no-extra-boolean-cast': 'error',
      'no-unneeded-ternary': 'error',
      ...prettier.rules,
      'eol-last': 'off',
    },
  },
  {
    name: 'stylistic',
    plugins: {
      '@stylistic': stylistic,
    },
    // https://eslint.style/rules
    rules: setStylisticRules({
      'block-spacing': 'error',
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'comma-spacing': ['error', { before: false, after: true }],
      'comma-style': ['error', 'last'],
      'computed-property-spacing': ['error', 'never'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'multiline-ternary': ['error', 'always-multiline'],
      'spaced-comment': ['error', 'always', { exceptions: ['-', '*'] }],
    }),
  },
  {
    files: ['**/*.vue'],
    languageOptions: getVueOrTsLanguageOptions('vue'),
    plugins: {
      vue,
      ...basePlugins,
    },
    // http://eslint.vuejs.org/rules/html-indent.html#rule-details
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: getVueOrTsLanguageOptions('ts'),
    plugins: {
      js,
      ...basePlugins,
    },
    extends: ['js/recommended'],
    rules: {
      'no-undef': 'off',
    },
  },
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },
])
