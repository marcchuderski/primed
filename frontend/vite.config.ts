/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwa } from './tools/pwa.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const designDir = fileURLToPath(new URL('../design', import.meta.url));
const frontendDir = fileURLToPath(new URL('.', import.meta.url));
// docs/ only for Vitest: a test keeps the in-app questionnaire in sync with the docs (D-108).
const docsDir = process.env.VITEST === undefined ? [] : [fileURLToPath(new URL('../docs', import.meta.url))];

// Local API runs in DDEV (see docs/ARCHITECTURE.md); the dev server proxies /api there.
const apiTarget = process.env.PRIMED_API_TARGET ?? 'https://primed.ddev.site';

export default defineConfig({
  plugins: [react(), pwa()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    strictPort: true,
    // design/tokens.css is imported directly from the design folder (single source of truth).
    fs: { allow: [frontendDir, designDir, ...docsDir] },
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, secure: false },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // No data: URIs in the bundle, so the CSP can stay at img-src/font-src 'self'.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
