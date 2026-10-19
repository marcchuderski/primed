import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const source = readFileSync(fileURLToPath(new URL('./theme-init.js', import.meta.url)), 'utf8');

/** Content-hashed path under /assets/, so it is precached by the service worker and cached as immutable. */
export const THEME_INIT_PATH = `assets/theme-init-${createHash('sha256').update(source).digest('hex').slice(0, 8)}.js`;

/** Flash-free theme start (roadmap 7.2): a blocking classic script at the end of <head> (after the theme-color metas, before the body is painted). */
export function themeInit(): Plugin {
  return {
    name: 'primed-theme-init',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== `/${THEME_INIT_PATH}`) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/javascript');
        res.end(source);
      });
    },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { src: `/${THEME_INIT_PATH}` }, injectTo: 'head' }];
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: THEME_INIT_PATH, source });
    },
  };
}
