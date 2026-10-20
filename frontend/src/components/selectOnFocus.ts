import type { FocusEvent } from 'react';

/**
 * Selects the whole value when a number field gets focus, so typing replaces it (D-167). iOS Safari and Chrome
 * place the caret after the tap that focused the field, so the selection is set again once that tap is done.
 */
export function selectOnFocus(event: FocusEvent<HTMLInputElement>): void {
  const input = event.currentTarget;
  input.select();
  window.setTimeout(() => {
    if (document.activeElement === input) {
      input.setSelectionRange(0, input.value.length);
    }
  }, 0);
}
