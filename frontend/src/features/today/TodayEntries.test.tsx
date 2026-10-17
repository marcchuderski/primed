import { render, screen, waitFor, within } from '@testing-library/react';
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
const day = {
  date: '2026-10-19',
  isToday: true,
  dayTypeId: 1,
  dayTypeName: 'Ruhetag',
  isTraining: false,
  trainingStart: null,
  durationMin: null,
  source: 'template',
  targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
};
const quark = {
  id: 7,
  date: '2026-10-19',
  timeMin: 630,
  foodId: 3,
  dishId: null,
  name: 'REWE Quarkcreme',
  amount: 1,
  unit: 'packung',
  quantity: 200,
  nutrients: { kcal: 134, protein: 24.8, carbs: 6.4, sugar: 5.2, fat: 1 },
  basis: 'per_100g',
  packageAmount: 200,
};
const bread = {
  ...quark,
  id: 8,
  timeMin: 490,
  name: 'REWE Dinkelbrötchen',
  amount: 90,
  unit: 'g',
  quantity: 90,
  nutrients: { kcal: 221.4, protein: 9, carbs: 41.4, sugar: 2.4, fat: 1.6 },
  packageAmount: null,
};

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('TodayScreen entries', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-19T12:30:00Z'));
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      let body: unknown;
      if (url.endsWith('/settings')) {
        body = { settings };
      } else if (url.endsWith('/entries')) {
        body = { entries: [bread, quark] };
      } else if (url.endsWith('/entries/7') && method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }));
      } else if (url.endsWith('/entries/7') && method === 'PATCH') {
        body = {
          entry: {
            ...quark,
            amount: 2,
            quantity: 400,
            nutrients: { ...quark.nutrients, kcal: 268, protein: 49.6 },
          },
        };
      } else {
        body = { day };
      }
      return Promise.resolve(new Response(JSON.stringify(body)));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('lists entries newest first with amount, macros and time, and sums the bars', async () => {
    render(<TodayScreen displayName="Marc" />);

    const items = await screen.findAllByRole('button', { name: /Bearbeiten$/ });
    expect(items.map((i) => i.getAttribute('aria-label'))).toEqual([
      'REWE Quarkcreme, 1 Packung, 10:30 Uhr. Bearbeiten',
      'REWE Dinkelbrötchen, 90 g, 08:10 Uhr. Bearbeiten',
    ]);
    expect(within(items.at(0) ?? document.body).getByText(/134 kcal/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Kalorien: 355 von 2.000. Details anzeigen' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Hey, Marc.').parentElement).toHaveTextContent('Noch 117 g Protein für heute.');
  });

  it('deletes only after confirmation', async () => {
    render(<TodayScreen displayName="Marc" />);

    await userEvent.click(await screen.findByRole('button', { name: /^REWE Quarkcreme/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Eintrag löschen' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Eintrag löschen?' });
    expect(dialog).toHaveTextContent('REWE Quarkcreme · 1 Packung wird aus diesem Tag entfernt.');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Eintrag löschen' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^REWE Quarkcreme/ })).not.toBeInTheDocument();
    });
  });

  it('edits the amount and shows the scaled nutrients before saving', async () => {
    render(<TodayScreen displayName="Marc" />);

    await userEvent.click(await screen.findByRole('button', { name: /^REWE Quarkcreme/ }));
    const sheet = screen.getByRole('dialog', { name: 'REWE Quarkcreme' });
    await userEvent.click(within(sheet).getByRole('button', { name: '2 Packungen' }));
    expect(within(sheet).getByText('268')).toBeInTheDocument();
    expect(within(sheet).getByText('= 400 g · 1 Packung = 200 g')).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole('button', { name: 'Speichern · 10:30' }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'REWE Quarkcreme, 2 Packungen, 10:30 Uhr. Bearbeiten' }),
      ).toBeInTheDocument();
    });
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patch?.[1]?.body).toBe(JSON.stringify({ amount: 2, unit: 'packung', timeMin: 630 }));
  });

  it('offers only units that fit the food basis', async () => {
    render(<TodayScreen displayName="Marc" />);

    await userEvent.click(await screen.findByRole('button', { name: /^REWE Dinkelbrötchen/ }));
    const units = within(screen.getByRole('group', { name: 'Einheit' }));
    expect(units.getByRole('button', { name: 'g' })).toBeEnabled();
    expect(units.getByRole('button', { name: 'EL' })).toBeEnabled();
    expect(units.getByRole('button', { name: 'ml' })).toBeDisabled();
    expect(units.getByRole('button', { name: 'Packung' })).toBeDisabled();
  });
});
