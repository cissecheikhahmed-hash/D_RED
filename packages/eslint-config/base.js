// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Shared base ESLint config for plain TypeScript packages (non-Next.js). */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
