import '@testing-library/jest-dom/vitest';

// jsdom has no <dialog> support; a minimal polyfill is enough for component tests.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
  if (!('open' in HTMLDialogElement.prototype)) {
    Object.defineProperty(HTMLDialogElement.prototype, 'open', {
      get(this: HTMLDialogElement) {
        return this.hasAttribute('open');
      },
    });
  }
}
