/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwa } from './tools/pwa.ts';
import { themeInit } from './tools/themeInit.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const designDir = fileURLToPath(new URL('../design', import.meta.url));
const frontendDir = fileURLToPath(new URL('.', import.meta.url));
// Only for Vitest: a test keeps the in-app questionnaire in sync with docs/ (D-108), another guards api/public/.htaccess.
const testDirs =
  process.env.VITEST === undefined
    ? []
    : [
        fileURLToPath(new URL('../docs', import.meta.url)),
        fileURLToPath(new URL('../api/public', import.meta.url)),
      ];

// Local API runs in DDEV (see docs/ARCHITECTURE.md); the dev server proxies /api there.
const apiTarget = process.env.PRIMED_API_TARGET ?? 'https://primed.ddev.site';

export default defineConfig({
  // themeInit before pwa: its asset must be in the bundle when the precache list is built.
  plugins: [react(), themeInit(), pwa()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    strictPort: true,
    // design/tokens.css is imported directly from the design folder (single source of truth).
    fs: { allow: [frontendDir, designDir, ...testDirs] },
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
