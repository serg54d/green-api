import {FlatCompat} from '@eslint/eslintrc';
import {defineConfig, globalIgnores} from 'eslint/config';
import prettier from 'eslint-config-prettier';

const compat = new FlatCompat({baseDirectory: import.meta.dirname});

export default defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'coverage/**',
    '.npm-cache/**',
    '.idea/**',
    '.runtime/**',
    '.swc/**',
    'next-env.d.ts',
  ]),
]);
