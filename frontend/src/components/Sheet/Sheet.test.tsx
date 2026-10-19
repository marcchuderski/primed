import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sheet } from './Sheet.tsx';

describe('Sheet (iOS open jump, D-161)', () => {
  it('focuses the dialog itself on open instead of the close button below the screen', () => {
    const { container } = render(
      <Sheet open title="Hinzufügen" onClose={() => undefined}>
        <input aria-label="Suchen" />
      </Sheet>,
    );
    const dialog = container.querySelector('dialog');
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveFocus();
  });

  it('undoes any scrolling of the dialog layer', () => {
    const { container } = render(
      <Sheet open title="Hinzufügen" onClose={() => undefined}>
        <p>Inhalt</p>
      </Sheet>,
    );
    const dialog = container.querySelector('dialog');
    if (dialog === null) throw new Error('no dialog');
    dialog.scrollTop = 120;
    fireEvent.scroll(dialog);
    expect(dialog.scrollTop).toBe(0);
  });
});
