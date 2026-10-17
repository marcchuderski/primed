import { render, screen } from '@testing-library/react';
import { LogoMark, Wordmark } from './Logo.tsx';

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

describe('Wordmark', () => {
  it('reads as "primed"', () => {
    const { container } = render(<Wordmark />);
    expect(container).toHaveTextContent('primed');
  });
});
