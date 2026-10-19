import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, forgetTheme, THEME_STORAGE_KEY } from './theme.ts';

function colors() {
  return Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
    (m) => m.content,
  );
}

describe('applyTheme (7.2)', () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<meta name="theme-color" content="#ECE3D6" media="(prefers-color-scheme: light)">' +
      '<meta name="theme-color" content="#17191D" media="(prefers-color-scheme: dark)">';
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('sets the attribute, the browser colour and the local copy for the next start', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(colors()).toEqual(['#17191D', '#17191D']);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    applyTheme('light');
    expect(colors()).toEqual(['#ECE3D6', '#ECE3D6']);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('restores the device default for "System" and when the account is deleted', () => {
    applyTheme('dark');
    applyTheme('system');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(colors()).toEqual(['#ECE3D6', '#17191D']);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

    applyTheme('light');
    forgetTheme();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
