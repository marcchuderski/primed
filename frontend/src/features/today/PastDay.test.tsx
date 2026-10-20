import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayScreen } from './TodayScreen.tsx';
import { useViewDay } from './useViewDay.ts';

const settings = {
  theme: 'system',
  proteinDefault: 150,
  defaultDurationMin: 90,
  earliestTrainingMin: 540,
  checkpoint: { offsetMin: 180, pct: 70, earliestMin: 360 },
  dayBoundaryMin: 120,
  tolerancePct: 5,
};
const pastDay = (over: Record<string, unknown> = {}) => ({
  date: '2026-10-19',
  isToday: false,
  editable: true,
  dayTypeId: 1,
  dayTypeName: 'Ruhetag',
  isTraining: false,
  trainingStart: null,
  durationMin: null,
  source: 'template',
  targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
  ...over,
});
const entry = (over: Record<string, unknown>) => ({
  id: 7,
  date: '2026-10-19',
  timeMin: 1170,
  foodId: 3,
  dishId: null,
  name: 'Skyr natur',
  amount: 250,
  unit: 'g',
  quantity: 250,
  nutrients: { kcal: 1960, protein: 140, carbs: 180, sugar: 40, fat: 60 },
  basis: 'per_100g',
  packageAmount: null,
  pieceWeight: null,
  ...over,
});
const historyDay = (date: string, kcal: number) => ({
  date,
  isToday: date === '2026-10-20',
  dayTypeName: 'Ruhetag',
  isTraining: false,
  targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
  eaten: { kcal, protein: 100, carbs: 100, fat: 50, sugar: 20 },
  entryCount: kcal > 0 ? 2 : 0,
});

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('past days (D-176, D-178)', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

  function mockApi(day: Record<string, unknown>, entries: unknown[]) {
    fetchMock.mockImplementation((input) => {
      const url = urlOf(input);
      if (url.endsWith('/settings')) return respond({ settings });
      if (url.includes('/history')) {
        return respond({
          today: '2026-10-20',
          days: [historyDay('2026-10-19', 2540), historyDay('2026-10-18', 0), historyDay('2026-10-20', 900)],
        });
      }
      if (url.endsWith('/entries')) return respond({ entries });
      if (url.endsWith('/shakes')) return respond({ shakes: [] });
      if (url.includes('/dishes')) return respond({ dishes: [] });
      if (url.endsWith('/foods/frequent')) return respond({ foods: [] });
      return respond({ day });
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T12:30:00Z'));
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('marks the past day, rates it and hides checkpoint and suggestions', async () => {
    mockApi(pastDay(), [entry({})]);
    const onDateChange = vi.fn();
    render(<TodayScreen displayName="Marc" date="2026-10-19" onDateChange={onDateChange} />);

    expect(await screen.findByText('Du bearbeitest Mo, 19.10.')).toBeInTheDocument();
    expect(urlOf(fetchMock.mock.calls[0]?.[0] ?? '')).toContain('/days/2026-10-19');
    expect(screen.queryByRole('heading', { name: /Hey/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Montag, 19.10., anderen Tag wählen' })).toHaveTextContent(
      'Mo, 19.10.',
    );
    expect(screen.getByText('Tagesbilanz')).toBeInTheDocument();
    expect(screen.getByText('im Rahmen').closest('span')).toHaveTextContent('im Rahmen−2 %');
    expect(screen.queryByRole('button', { name: 'Vorschläge' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Ziel bis Training/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Für Mo, 19.10. hinzufügen' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Zu heute' }));
    expect(onDateChange).toHaveBeenCalledWith(null);
  });

  it('logs into the past day with the time of its last entry', async () => {
    mockApi(pastDay(), [entry({})]);
    render(<TodayScreen displayName="Marc" date="2026-10-19" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Für Mo, 19.10. hinzufügen' }));
    expect(await screen.findByRole('dialog', { name: 'Hinzufügen' })).toHaveTextContent('Für Montag, 19.10.');
  });

  it('shows older days read only', async () => {
    mockApi(pastDay({ date: '2026-10-12', editable: false }), [entry({ date: '2026-10-12' })]);
    render(<TodayScreen displayName="Marc" date="2026-10-12" />);

    expect(await screen.findByText('Nur ansehen')).toBeInTheDocument();
    expect(screen.getByText('Nachtragen geht bis 7 Tage zurück.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hinzufügen/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Skyr natur/ })).not.toBeInTheDocument();
    expect(screen.getByText('Skyr natur · 250 g')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tagesart: Ruhetag' })).toBeDisabled();
  });

  it('switches days with the day picker', async () => {
    mockApi({ ...pastDay({ date: '2026-10-20', isToday: true }) }, []);
    const onDateChange = vi.fn();
    render(<TodayScreen displayName="Marc" onDateChange={onDateChange} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Dienstag, 20.10., anderen Tag wählen' }),
    );
    const sheet = screen.getByRole('dialog', { name: 'Tag wählen' });
    const yesterday = await within(sheet).findByRole('button', { name: /Gestern · Mo, 19\.10\./ });
    expect(yesterday).toHaveTextContent('2.540 kcal');
    expect(within(sheet).getAllByRole('listitem')).toHaveLength(8);
    expect(within(sheet).getByRole('button', { name: /Heute · Di, 20\.10\./ })).toHaveAttribute(
      'aria-current',
      'date',
    );

    await userEvent.click(yesterday);
    expect(onDateChange).toHaveBeenCalledWith('2026-10-19');
    await userEvent.click(screen.getByRole('button', { name: 'Dienstag, 20.10., anderen Tag wählen' }));
    await userEvent.click(await screen.findByRole('button', { name: /Heute · Di, 20\.10\./ }));
    expect(onDateChange).toHaveBeenLastCalledWith(null);
  });
});

describe('useViewDay', () => {
  it('jumps back to today when the app becomes visible or regains focus', () => {
    const { result } = renderHook(() => useViewDay());
    act(() => {
      result.current[1]('2026-10-19');
    });
    expect(result.current[0]).toBe('2026-10-19');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1]('2026-10-18');
    });
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current[0]).toBeNull();
  });
});
