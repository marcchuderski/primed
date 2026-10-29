import { fireEvent, render, screen } from '@testing-library/react';
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

  it('shows a "more below" arrow until the end of the content is reached (D-163)', () => {
    render(
      <Sheet open title="Banane" onClose={() => undefined}>
        <p>Inhalt</p>
      </Sheet>,
    );
    const body = screen.getByText('Inhalt').parentElement;
    if (body === null) throw new Error('no body');
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 400 });
    fireEvent.scroll(body);
    expect(screen.getByRole('button', { name: 'Nach unten scrollen' })).toBeInTheDocument();

    body.scrollTop = 600;
    fireEvent.scroll(body);
    expect(screen.queryByRole('button', { name: 'Nach unten scrollen' })).not.toBeInTheDocument();
  });

  it('locks the page behind while any sheet is open, also with stacked sheets', () => {
    const root = document.documentElement;
    const first = render(
      <Sheet open title="Hinzufügen" onClose={() => undefined}>
        <p>Suche</p>
      </Sheet>,
    );
    expect(root).toHaveClass('scroll-locked');

    const second = render(
      <Sheet open title="Banane" onClose={() => undefined}>
        <p>Menge</p>
      </Sheet>,
    );
    second.unmount();
    expect(root).toHaveClass('scroll-locked');

    first.rerender(
      <Sheet open={false} title="Hinzufügen" onClose={() => undefined}>
        <p>Suche</p>
      </Sheet>,
    );
    expect(root).not.toHaveClass('scroll-locked');
  });
});
