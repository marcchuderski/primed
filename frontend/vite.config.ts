/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const designDir = fileURLToPath(new URL('../design', import.meta.url));
const frontendDir = fileURLToPath(new URL('.', import.meta.url));

// Local API runs in DDEV (see docs/ARCHITECTURE.md); the dev server proxies /api there.
const apiTarget = process.env.PRIMED_API_TARGET ?? 'https://primed.ddev.site';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    strictPort: true,
    // design/tokens.css is imported directly from the design folder (single source of truth).
    fs: { allow: [frontendDir, designDir] },
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, secure: false },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
