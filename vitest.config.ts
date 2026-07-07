import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(ROOT, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});
