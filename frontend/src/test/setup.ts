import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// More headroom for findBy/waitFor when the machine is busy (e.g. a parallel build); avoids flaky timeouts.
configure({ asyncUtilTimeout: 3000 });

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
