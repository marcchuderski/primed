// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { precacheList, renderServiceWorker } from './pwa.ts';

describe('PWA build (7.3)', () => {
  it('precaches the app shell but not lazily loaded chunks', () => {
    const list = precacheList({
      'assets/index-abc12345.js': { type: 'chunk', isDynamicEntry: false },
      'assets/esm-def67890.js': { type: 'chunk', isDynamicEntry: true },
      'assets/index-abc12345.css': { type: 'asset' },
      'assets/inter-12345678.woff2': { type: 'asset' },
      'pwa/icon-192.png': { type: 'asset' },
      'index.html': { type: 'asset' },
    });
    expect(list).toEqual([
      '/assets/index-abc12345.css',
      '/assets/index-abc12345.js',
      '/assets/inter-12345678.woff2',
    ]);
  });

  it('fills the template and changes the version with the files', () => {
    const template = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
    const a = renderServiceWorker(template, ['/assets/a-11111111.js']);
    const b = renderServiceWorker(template, ['/assets/a-22222222.js']);
    expect(a).not.toContain('__PRIMED_');
    expect(a).toContain('const PRECACHE = ["/assets/a-11111111.js"];');
    const version = (sw: string) => /const VERSION = '([0-9a-f]{12})'/.exec(sw)?.[1];
    expect(version(a)).toBeDefined();
    expect(version(a)).not.toBe(version(b));
  });

  it('never touches the API in the service worker', () => {
    const sw = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
    expect(sw).toContain("url.pathname.startsWith('/api/')");
    expect(sw).toContain("request.method !== 'GET'");
  });
});
