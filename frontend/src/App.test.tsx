import { render, screen } from '@testing-library/react';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the wordmark heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'primed' })).toBeInTheDocument();
  });
});
