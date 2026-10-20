import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayScreen } from './TodayScreen.tsx';

const settings = {
  theme: 'system',
  proteinDefault: 150,
  defaultDurationMin: 90,
  earliestTrainingMin: 540,
  checkpoint: { offsetMin: 180, pct: 70, earliestMin: 360 },
  dayBoundaryMin: 120,
};

function mockApi(day: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input) => {
      const url = input instanceof Request ? input.url : input.toString();
      const body = url.endsWith('/settings')
        ? { settings }
        : url.endsWith('/entries')
          ? { entries: [] }
          : { day };
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    }),
  );
}

const basketball = {
  date: '2026-10-20',
  isToday: true,
  dayTypeId: 4,
  dayTypeName: 'Normal · Basketball',
  isTraining: true,
  trainingStart: 1200,
  durationMin: 90,
  source: 'template',
  targets: { kcal: 2600, protein: 150, carbs: 350, sugar: 50 },
};

describe('TodayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T12:30:00Z')); // 14:30 Berlin
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('greets situationally and shows date, day type chip and targets', async () => {
    mockApi(basketball);
    render(<TodayScreen displayName="Marc" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Hey, Marc.' })).toBeInTheDocument();
    expect(screen.getByText('Noch 2½ Stunden bis zu deinem Pre-Workout.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dienstag, 20.10., anderen Tag wählen' })).toHaveTextContent(
      'Di, 20.10.',
    );
    expect(screen.queryByRole('status', { name: '' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Tagesart: Normal · Basketball · 20:00. Ändern' }),
    ).toBeInTheDocument();
    expect(screen.getByText('/ 2.600')).toBeInTheDocument();
    expect(screen.getByText('0 / ~67 g')).toBeInTheDocument();
    expect(screen.getByText('Ziel bis Training · Balken antippen für Details')).toBeInTheDocument();
  });

  it('opens the checkpoint details when a bar is tapped and closes them with Escape', async () => {
    mockApi(basketball);
    render(<TodayScreen displayName="Marc" />);

    const kcal = await screen.findByRole('button', { name: /^Kalorien:/ });
    await userEvent.click(kcal);
    const details = screen.getByRole('status');
    expect(details).toHaveTextContent('Bis 17:00 · Pre-Workout');
    expect(details).toHaveTextContent('0 von 1.820 kcal · noch 1.820');
    expect(details).toHaveTextContent('Gesamt heute: 2.600 kcal');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows no marker legend on rest days', async () => {
    mockApi({
      ...basketball,
      dayTypeName: 'Ruhetag',
      isTraining: false,
      trainingStart: null,
      durationMin: null,
      targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
    });
    render(<TodayScreen displayName="Marc" />);

    expect(await screen.findByRole('button', { name: 'Tagesart: Ruhetag. Ändern' })).toBeInTheDocument();
    expect(screen.queryByText(/Ziel bis Training/)).not.toBeInTheDocument();
  });
});
