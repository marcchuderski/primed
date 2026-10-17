import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MacroBar } from './MacroBar.tsx';

describe('MacroBar', () => {
  it('shows eaten and target with German numbers', () => {
    render(<MacroBar label="Kalorien" eaten={1092} target={2600} />);
    expect(screen.getByText('1.092')).toBeInTheDocument();
    expect(screen.getByText('/ 2.600')).toBeInTheDocument();
  });

  it('shows the excess when the target is exceeded', () => {
    render(<MacroBar label="Kalorien" eaten={2780} target={2600} />);
    expect(screen.getByText('+180')).toBeInTheDocument();
  });

  it('marks reference targets as approximate', () => {
    render(<MacroBar label="Fett" eaten={19} target={67} unit="g" variant="small" approximate />);
    expect(screen.getByText('19 / ~67 g')).toBeInTheDocument();
  });

  it('is a toggle button with a descriptive label when tappable', async () => {
    const onToggle = vi.fn();
    render(
      <MacroBar
        label="Protein"
        eaten={95}
        target={150}
        unit="g"
        variant="protein"
        onToggle={onToggle}
        expanded={false}
      />,
    );
    const button = screen.getByRole('button', { name: 'Protein: 95 von 150 g. Details anzeigen' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
