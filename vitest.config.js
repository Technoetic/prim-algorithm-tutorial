import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.js'],
    exclude: [
      'node_modules/**',
      'step_archive/**',
      'dist/**',
    ],
  },
});
