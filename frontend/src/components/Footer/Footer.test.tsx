import { render, screen } from '@testing-library/react';
import { Footer } from './Footer.tsx';

describe('Footer', () => {
  it('shows the app version', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`v${__APP_VERSION__} · Bereit für heute.`);
  });
});
