// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { THEME_INIT_PATH } from './themeInit.ts';

const source = readFileSync(new URL('./theme-init.js', import.meta.url), 'utf8');

/** Minimal stand-ins for the few DOM APIs the script uses. */
function run(stored: string | null, storageThrows = false) {
  const attrs = new Map<string, string>();
  const meta = (media: string, content: string) => {
    const m = new Map([
      ['media', media],
      ['content', content],
    ]);
    return {
      getAttribute: (n: string) => m.get(n) ?? null,
      setAttribute: (n: string, v: string) => m.set(n, v),
      values: m,
    };
  };
  const metas = [
    meta('(prefers-color-scheme: light)', '#ECE3D6'),
    meta('(prefers-color-scheme: dark)', '#17191D'),
  ];
  runInNewContext(source, {
    localStorage: {
      getItem: () => {
        if (storageThrows) throw new Error('SecurityError');
        return stored;
      },
    },
    document: {
      documentElement: { setAttribute: (n: string, v: string) => attrs.set(n, v) },
      querySelectorAll: () => metas,
    },
  });
  return { theme: attrs.get('data-theme'), colors: metas.map((m) => m.values.get('content')), metas };
}

describe('flash-free theme start (7.2)', () => {
  it('applies a stored override and its browser colour before the first paint', () => {
    const dark = run('dark');
    expect(dark.theme).toBe('dark');
    expect(dark.colors).toEqual(['#17191D', '#17191D']);
    expect(dark.metas[0]?.values.get('data-color')).toBe('#ECE3D6');
    expect(run('light').colors).toEqual(['#ECE3D6', '#ECE3D6']);
  });

  it('follows the device without a valid stored value or when storage is blocked', () => {
    for (const r of [run(null), run('system'), run('"><script>'), run('dark', true)]) {
      expect(r.theme).toBeUndefined();
      expect(r.colors).toEqual(['#ECE3D6', '#17191D']);
    }
  });

  it('is served as a content-hashed, precached asset', () => {
    expect(THEME_INIT_PATH).toMatch(/^assets\/theme-init-[0-9a-f]{8}\.js$/);
  });
});
