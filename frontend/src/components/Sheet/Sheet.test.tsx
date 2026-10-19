import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sheet } from './Sheet.tsx';

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }));
}

function renderSheet(open: boolean, item: string | null) {
  return (
    <Sheet open={open} title="Menge" onClose={() => undefined}>
      {item !== null && <p>{item}</p>}
    </Sheet>
  );
}

describe('Sheet exit animation (DESIGN.md §8)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('slides out with the last content, then closes the dialog', () => {
    stubMotion(false);
    const { rerender, container } = render(renderSheet(true, 'Skyr'));
    const dialog = container.querySelector('dialog');
    expect(dialog).toHaveAttribute('open');

    // The parent clears its content together with closing; the sheet keeps showing it while sliding out.
    rerender(renderSheet(false, null));
    expect(screen.getByText('Skyr')).toBeInTheDocument();
    expect(dialog).toHaveAttribute('open');
    expect(dialog?.className).toMatch(/closing/);

    const sheet = screen.getByRole('heading', { name: 'Menge' }).closest('div[class*="sheet"]');
    fireEvent.animationEnd(sheet ?? document.body);
    expect(screen.queryByText('Skyr')).not.toBeInTheDocument();
    expect(dialog).not.toHaveAttribute('open');
  });

  it('closes after a fallback timeout when no animationend arrives', () => {
    stubMotion(false);
    vi.useFakeTimers();
    const { rerender, container } = render(renderSheet(true, 'Skyr'));
    rerender(renderSheet(false, null));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByText('Skyr')).not.toBeInTheDocument();
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('reopening while sliding out keeps the sheet open with the new content', () => {
    stubMotion(false);
    const { rerender, container } = render(renderSheet(true, 'Skyr'));
    rerender(renderSheet(false, null));
    rerender(renderSheet(true, 'Quark'));
    expect(screen.getByText('Quark')).toBeInTheDocument();
    expect(container.querySelector('dialog')?.className).not.toMatch(/closing/);
    expect(container.querySelector('dialog')).toHaveAttribute('open');
  });

  it('closes at once with reduced motion', () => {
    stubMotion(true);
    const { rerender, container } = render(renderSheet(true, 'Skyr'));
    rerender(renderSheet(false, null));
    expect(screen.queryByText('Skyr')).not.toBeInTheDocument();
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('does not steal focus from a sheet opened while the previous one slides out', () => {
    stubMotion(false);
    const { rerender } = render(
      <>
        {renderSheet(true, 'Skyr')}
        <Sheet open={false} title="Suche" onClose={() => undefined}>
          <input aria-label="Suchen" />
        </Sheet>
      </>,
    );
    rerender(
      <>
        {renderSheet(false, null)}
        <Sheet open title="Suche" onClose={() => undefined}>
          <input aria-label="Suchen" />
        </Sheet>
      </>,
    );
    const search = screen.getByRole('textbox', { name: 'Suchen' });
    search.focus();
    const first = screen.getByRole('heading', { name: 'Menge' }).closest('div[class*="sheet"]');
    fireEvent.animationEnd(first ?? document.body);
    expect(screen.queryByText('Skyr')).not.toBeInTheDocument();
    expect(search).toHaveFocus();
  });
});
