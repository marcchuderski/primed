import { testSettings } from '../../test/fixtures.ts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Day, Settings } from '../../api/days.ts';
import { DayTypeSheet } from './DayTypeSheet.tsx';

const settings: Settings = testSettings;

const day: Day = {
  date: '2026-10-20',
  isToday: true,
  editable: true,
  dayTypeId: 4,
  dayTypeName: 'Normal · Basketball',
  isTraining: true,
  trainingStart: 1200,
  durationMin: 90,
  source: 'template',
  statsExcluded: false,
  targets: { kcal: 2600, protein: 150, carbs: 350, sugar: 50 },
};

const dayTypes = [
  {
    id: 1,
    name: 'Ruhetag',
    kcal: 2000,
    protein: null,
    effectiveProtein: 150,
    carbs: 200,
    sugarRef: 50,
    isTraining: false,
    sort: 1,
    isRest: true,
  },
  {
    id: 4,
    name: 'Normal · Basketball',
    kcal: 2600,
    protein: null,
    effectiveProtein: 150,
    carbs: 350,
    sugarRef: 50,
    isTraining: true,
    sort: 4,
    isRest: false,
  },
];

describe('DayTypeSheet', () => {
  it('collapses to the selected training day with "Auswahl ändern" and offers 30 to 120 min', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ dayTypes })));
    render(<DayTypeSheet open day={day} settings={settings} onClose={vi.fn()} onSaved={vi.fn()} />);

    await screen.findByRole('button', { name: 'Auswahl ändern' });
    expect(screen.queryByRole('button', { name: /Ruhetag/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /min$/ }).map((b) => b.textContent)).toEqual([
      '30 min',
      '60 min',
      '90 min',
      '120 min',
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Auswahl ändern' }));
    await userEvent.click(screen.getByRole('button', { name: /Normal · Basketball/ }));
    expect(screen.queryByRole('button', { name: /Ruhetag/ })).not.toBeInTheDocument();
  });

  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows day types with the current one selected, training time and duration', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ dayTypes })));
    render(<DayTypeSheet open day={day} settings={settings} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Tagesart' })).toBeInTheDocument();
    expect(screen.getByText('Dienstag · aus Wochenvorlage')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Normal · Basketball/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('option', { name: '20', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 min' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switching to a rest day hides the training settings and saves without time', async () => {
    const onSaved = vi.fn();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ dayTypes }))).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          day: {
            ...day,
            dayTypeId: 1,
            dayTypeName: 'Ruhetag',
            isTraining: false,
            trainingStart: null,
            durationMin: null,
            source: 'manual',
          },
        }),
      ),
    );
    render(<DayTypeSheet open day={day} settings={settings} onClose={vi.fn()} onSaved={onSaved} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Auswahl ändern' }));
    await userEvent.click(screen.getByRole('button', { name: /Ruhetag/ }));
    expect(screen.queryByText('Training um')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    const [url, init] = fetchMock.mock.calls[1] ?? [];
    expect(url).toBe('/api/v1/days/2026-10-20');
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ dayTypeId: 1, trainingStart: null, durationMin: null }));
  });

  it('changes the training time with the keyboard and the duration by tap', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ dayTypes })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ day })));
    render(<DayTypeSheet open day={day} settings={settings} onClose={vi.fn()} onSaved={vi.fn()} />);

    const minutes = await screen.findByRole('listbox', { name: 'Training um Minute' });
    minutes.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(screen.getByRole('button', { name: '120 min' }));
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ dayTypeId: 4, trainingStart: 1215, durationMin: 120 }),
    );
  });

  it('shows server validation errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ dayTypes }))).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: 'validation_failed', message: 'Ungültige Trainingszeit.' } }),
        {
          status: 422,
        },
      ),
    );
    render(<DayTypeSheet open day={day} settings={settings} onClose={vi.fn()} onSaved={vi.fn()} />);

    await screen.findByRole('button', { name: 'Auswahl ändern' });
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige Trainingszeit.');
  });
});
