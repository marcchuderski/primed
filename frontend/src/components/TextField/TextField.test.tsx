import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField.tsx';

describe('TextField', () => {
  it('associates the label with the input', async () => {
    render(<TextField label="Username" autoComplete="username" />);
    const input = screen.getByLabelText('Username');
    await userEvent.type(input, 'marcch');
    expect(input).toHaveValue('marcch');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('links the hint via aria-describedby', () => {
    render(<TextField label="Passwort" type="password" hint="Mindestens 12 Zeichen" />);
    expect(screen.getByLabelText('Passwort')).toHaveAccessibleDescription('Mindestens 12 Zeichen');
  });

  it('gives each instance a unique id', () => {
    render(
      <>
        <TextField label="A" />
        <TextField label="B" />
      </>,
    );
    expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id);
  });
});
