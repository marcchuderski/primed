import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  describe('swipe down to dismiss (D-185)', () => {
    function drag(title: HTMLElement, sheetHeight: number, dy: number, ms = 1000) {
      const sheet = title.closest('[class*="sheet"]');
      if (!(sheet instanceof HTMLElement)) throw new Error('no sheet');
      Object.defineProperty(sheet, 'offsetHeight', { configurable: true, value: sheetHeight });
      const grab = title.closest('[class*="grab"]');
      if (grab === null) throw new Error('no grab area');
      // jsdom has no pointer capture.
      Object.defineProperty(grab, 'setPointerCapture', { configurable: true, value: () => undefined });
      // Fixed time stamps, so the flick speed does not depend on how fast the test runs.
      const at = (type: string, y: number, timeStamp: number) => {
        const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: 100, clientY: y });
        Object.defineProperty(event, 'timeStamp', { value: timeStamp });
        Object.defineProperty(event, 'pointerId', { value: 1 });
        fireEvent(grab, event);
      };
      at('pointerdown', 100, 0);
      at('pointermove', 120, 10);
      at('pointermove', 100 + dy, ms);
      at('pointerup', 100 + dy, ms);
    }

    it('closes when dragged past 30 % of the sheet height', () => {
      const onClose = vi.fn();
      render(
        <Sheet open title="Banane" onClose={onClose}>
          <p>Menge</p>
        </Sheet>,
      );
      drag(screen.getByRole('heading', { name: 'Banane' }), 600, 200);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('springs back after a short, slow drag', () => {
      const onClose = vi.fn();
      render(
        <Sheet open title="Banane" onClose={onClose}>
          <p>Menge</p>
        </Sheet>,
      );
      drag(screen.getByRole('heading', { name: 'Banane' }), 600, 60);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('asks before discarding unsaved input', async () => {
      const onClose = vi.fn();
      render(
        <Sheet open dirty title="Neues Produkt" onClose={onClose}>
          <p>Formular</p>
        </Sheet>,
      );
      drag(screen.getByRole('heading', { name: 'Neues Produkt' }), 600, 300);
      expect(onClose).not.toHaveBeenCalled();
      const dialog = screen.getByRole('alertdialog', { name: 'Änderungen verwerfen?' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Verwerfen' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      await Promise.resolve();
    });

    it('keeps a plain tap on "Schließen" working', () => {
      const onClose = vi.fn();
      render(
        <Sheet open title="Banane" onClose={onClose}>
          <p>Menge</p>
        </Sheet>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
