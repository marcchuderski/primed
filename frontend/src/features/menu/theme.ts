import type { Settings } from '../../api/days.ts';

/** Applies the theme to <html> (DESIGN.md: no attribute = follow the device). */
export function applyTheme(theme: Settings['theme']): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
