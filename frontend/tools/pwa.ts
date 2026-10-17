import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const brandDir = new URL('../../design/brand/', import.meta.url);
const swTemplate = new URL('./sw.js', import.meta.url);

/** Icons from design/brand (single source, DESIGN.md §2), served under /pwa/ (not /icons/: Apache's default alias would shadow it). */
export const ICONS = [
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
] as const;

/** Files the service worker precaches: everything in the bundle except lazily loaded chunks (e.g. the scanner). */
export function precacheList(bundle: Record<string, { type: string; isDynamicEntry?: boolean }>): string[] {
  return Object.entries(bundle)
    .filter(
      ([name, file]) =>
        name.startsWith('assets/') && !(file.type === 'chunk' && file.isDynamicEntry === true),
    )
    .map(([name]) => `/${name}`)
    .sort();
}

/** Fills the service worker template; the version changes whenever a precached file changes. */
export function renderServiceWorker(template: string, files: string[]): string {
  const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
  return template
    .replace('__PRIMED_VERSION__', version)
    .replace('__PRIMED_PRECACHE__', JSON.stringify(files));
}

/** PWA (roadmap 7.3): icons from design/brand, generated sw.js. Manifest lives in public/. */
export function pwa(): Plugin {
  return {
    name: 'primed-pwa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.startsWith('/pwa/') === true ? req.url.slice('/pwa/'.length) : '';
        if (!(ICONS as readonly string[]).includes(name)) {
          next();
          return;
        }
        res.setHeader('Content-Type', name.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
        res.end(readFileSync(new URL(name, brandDir)));
      });
    },
    generateBundle(_options, bundle) {
      for (const name of ICONS) {
        this.emitFile({
          type: 'asset',
          fileName: `pwa/${name}`,
          source: readFileSync(new URL(name, brandDir)),
        });
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: renderServiceWorker(readFileSync(fileURLToPath(swTemplate), 'utf8'), precacheList(bundle)),
      });
    },
  };
}
