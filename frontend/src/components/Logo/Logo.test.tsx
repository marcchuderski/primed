import { render, screen } from '@testing-library/react';
import { LogoLockup, LogoMark } from './Logo.tsx';

describe('LogoMark', () => {
  it('is decorative without a label', () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible name when labelled', () => {
    render(<LogoMark label="Primed lädt" />);
    expect(screen.getByRole('img', { name: 'Primed lädt' })).toBeInTheDocument();
  });
});

describe('LogoLockup', () => {
  it('is announced as "Primed" while the visible text is "rimed"', () => {
    render(<LogoLockup />);
    const lockup = screen.getByRole('img', { name: 'Primed' });
    expect(lockup).toHaveTextContent('rimed');
  });
});
