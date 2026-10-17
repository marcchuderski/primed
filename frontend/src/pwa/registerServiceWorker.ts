/** Registers the app-shell service worker (7.3). Production only: the dev server must never be cached. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Without a service worker the app works the same, only without the offline shell.
    });
  });
}
