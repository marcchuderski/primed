import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.tsx';

describe('Button', () => {
  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Abbrechen</Button>);
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Hinzufügen</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and marked busy while busy', async () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Einloggen
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Einloggen' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
