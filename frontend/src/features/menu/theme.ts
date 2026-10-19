import type { Settings } from '../../api/days.ts';

/** Local copy of the theme setting, read by tools/theme-init.js before the first paint (7.2, D-148). */
export const THEME_STORAGE_KEY = 'primed.theme';

/** Applies the theme to <html> (DESIGN.md: no attribute = follow the device) and remembers it on this device. */
export function applyTheme(theme: Settings['theme']): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  syncThemeColor(theme);
  try {
    if (theme === 'system') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Storage blocked: the theme still applies, only the next start follows the device until settings load.
  }
}

/** Forgets the theme on this device (account deleted). */
export function forgetTheme(): void {
  applyTheme('system');
}

/**
 * Browser UI colour (index.html has one theme-color meta per device scheme). With an override, every meta
 * gets the colour of the chosen theme; the original value is kept in data-color to restore "System".
 */
function syncThemeColor(theme: Settings['theme']): void {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  for (const meta of metas) {
    meta.dataset['color'] ??= meta.content;
  }
  const chosen = metas.find((m) => (m.getAttribute('media') ?? '').includes(theme))?.dataset['color'];
  for (const meta of metas) {
    const own = meta.dataset['color'] ?? meta.content;
    meta.content = theme === 'system' || chosen === undefined ? own : chosen;
  }
}
