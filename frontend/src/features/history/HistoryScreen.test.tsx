import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testSettings } from '../../test/fixtures.ts';
import { HistoryScreen } from './HistoryScreen.tsx';

const targets = { kcal: 2000, protein: 150, carbs: 200, sugar: 50 };
const day = (date: string, kcal: number, protein: number, extra: Record<string, unknown> = {}) => ({
  date,
  isToday: false,
  dayTypeName: 'Ruhetag',
  isTraining: false,
  targets,
  eaten: { kcal, protein, carbs: 180, fat: 60, sugar: 40 },
  entryCount: kcal > 0 ? 4 : 0,
  ...extra,
});
// Account created Thu 15.10.; today Tue 20.10.2026.
const october = [
  day('2026-10-15', 1800, 140), // low
  day('2026-10-16', 2000, 160), // ok
  day('2026-10-17', 0, 0), // empty
  day('2026-10-18', 2300, 120, { dayTypeName: 'Normal · Basketball', isTraining: true }), // high
  day('2026-10-19', 1950, 150), // ok
  day('2026-10-20', 900, 60, { isToday: true }), // running
];

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('HistoryScreen (6.2–6.4)', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'));
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) => {
      const url = new URL(urlOf(input), 'https://primed.test');
      if (url.pathname.endsWith('/settings')) return respond({ settings: testSettings });
      const from = url.searchParams.get('from') ?? '';
      const to = url.searchParams.get('to') ?? '';
      return respond({ today: '2026-10-20', days: october.filter((d) => d.date >= from && d.date <= to) });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const ranges = () =>
    fetchMock.mock.calls
      .map(([u]) => new URL(urlOf(u), 'https://primed.test'))
      .filter((u) => u.pathname.endsWith('/history'))
      .map((u) => `${u.searchParams.get('from') ?? ''}..${u.searchParams.get('to') ?? ''}`);

  it('shows the current ISO week with balance, tiles and a table with Σ column', async () => {
    render(<HistoryScreen />);
    expect(await screen.findByText('KW 43')).toBeInTheDocument();
    expect(screen.getByText('19.–25. Oktober')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Bereit für heute.');
    await waitFor(() => {
      expect(ranges()).toEqual(['2026-10-19..2026-10-25']);
    });
    expect(screen.getByRole('button', { name: 'Nächste Woche' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Nächste Woche' }));
    expect(screen.getByText('KW 43')).toBeInTheDocument();

    // Only Monday counts this week (today is running): 1950 vs 2000.
    const card = await screen.findByRole('region', { name: 'Wochenbilanz' });
    expect(card).toHaveTextContent('−50 kcal');
    expect(card).toHaveTextContent('ausgeglichen');
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Σ Woche' })).toBeInTheDocument();
    expect(within(table).getByText('läuft')).toBeInTheDocument();
    expect(within(table).getByText('1 Tag')).toBeInTheDocument();
  });

  it('goes back a week and excludes empty and running days from the balance', async () => {
    render(<HistoryScreen />);
    await screen.findByText('KW 43');
    await userEvent.click(screen.getByRole('button', { name: 'Vorherige Woche' }));
    expect(await screen.findByText('KW 42')).toBeInTheDocument();
    const card = await screen.findByRole('region', { name: 'Wochenbilanz' });
    // 15.–18.: 1800 + 2000 + 2300 = 6100 vs 6000 target (17. has no entries).
    expect(card).toHaveTextContent('+100 kcal');
    expect(card).toHaveTextContent('140 g'); // Ø protein (140+160+120)/3
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('img', { name: 'keine Einträge' })).toHaveLength(1);
    expect(within(table).getByText('Basket.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nächste Woche' })).toBeEnabled();
  });

  it('shows the month calendar with today, training days and empty days', async () => {
    render(<HistoryScreen />);
    await screen.findByText('KW 43');
    await userEvent.click(screen.getByRole('button', { name: 'Monat' }));
    expect(await screen.findByText('Oktober 2026')).toBeInTheDocument();
    await waitFor(() => {
      expect(ranges()).toContain('2026-10-01..2026-10-31');
    });
    const calendar = await screen.findByRole('grid', { name: 'Kalender' });
    expect(within(calendar).getByRole('button', { name: '20.: heute. öffnen' })).toBeInTheDocument();
    expect(
      within(calendar).getByRole('button', { name: '18.: über Soll, Trainingstag. öffnen' }),
    ).toBeInTheDocument();
    expect(within(calendar).getByRole('button', { name: '17.: keine Einträge. öffnen' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Monatsbilanz bis heute' })).toBeInTheDocument();
  });

  it('shows the year with month bars and the month list', async () => {
    render(<HistoryScreen />);
    await screen.findByText('KW 43');
    await userEvent.click(screen.getByRole('button', { name: 'Jahr' }));
    expect(await screen.findByText('2026')).toBeInTheDocument();
    await waitFor(() => {
      expect(ranges()).toContain('2026-01-01..2026-12-31');
    });
    const card = await screen.findByRole('region', { name: 'Jahresbilanz bis heute' });
    expect(within(card).getByRole('img', { name: 'Monatsbilanzen als Balken' })).toBeInTheDocument();
    expect(card).toHaveTextContent('50 %'); // 2 of 4 counted days within the range
    expect(screen.getByText('Oktober')).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 4 im Rahmen/)).toBeInTheDocument();
  });
});
