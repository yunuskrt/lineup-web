import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // The component template keeps an empty Props type
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' },
      ],
      // The template imports React; react-jsx doesn't need it
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^React$' },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
