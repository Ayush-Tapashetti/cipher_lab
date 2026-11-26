import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['evals/**/*.eval.ts'], setupFiles: ['./vitest.setup.ts'], reporters: ['default'] },
});
