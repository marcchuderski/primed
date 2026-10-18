import { testSettings } from '../../test/fixtures.ts';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Day } from '../../api/days.ts';
import { SuggestionsSheet } from './SuggestionsSheet.tsx';

const m = (kcal: number, protein: number, carbs = 10, fat = 2) => ({ kcal, protein, carbs, fat, sugar: 1 });
const day: Day = {
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
  id: 3,
  type: 'product',
  name: 'REWE Quarkcreme',
  brand: null,
  barcode: null,
  category: 'dairy',
  basis: 'per_100g',
  nutrients: { kcal: 67, protein: 12.4, carbs: 3.2, sugar: 2.6, fat: 0.5 },
  packageAmount: 200,
  usageCount: 3,
  lastAmount: 1,
  lastUnit: 'packung',
};

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('SuggestionsSheet', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input) => {
      const url = urlOf(input);
      if (url.endsWith('/shakes')) {
        return respond({
          shakes: [
            {
              id: 'small_milk_high',
              size: 'small',
              liquid: 'milk_high',
              name: 'Shake Klein · Milch 3,5 %',
              label: 'Klein · Milch 3,5 %',
              nutrients: m(240, 28),
            },
          ],
        });
      }
      if (url.includes('/dishes')) return respond({ dishes: [] });
      if (url.includes('/foods')) return respond({ foods: [quark] });
      if (url.endsWith('/entries/shake')) {
        return respond(
          {
            entry: {
              id: 1,
              date: '2026-10-19',
              timeMin: 1200,
              kind: 'shake',
              foodId: null,
              dishId: null,
              name: 'Shake Klein · Milch 3,5 %',
              amount: 1,
              unit: 'stueck',
              quantity: 1,
              nutrients: m(240, 28),
              basis: null,
              packageAmount: null,
            },
          },
          201,
        );
      }
      return respond({ error: { code: 'x', message: url } }, 500);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('suggests an evening shake and a food, and logs with one tap', async () => {
    const onAdded = vi.fn();
    render(
      <SuggestionsSheet
        day={day}
        settings={{ ...testSettings, shakeFoods: { proteinPowder: 99 } }}
        now={19 * 60 + 50}
        checkpoint={null}
        eaten={m(1400, 100)}
        eatenUntilCheckpoint={null}
        onClose={vi.fn()}
        onAdded={onAdded}
      />,
    );

    expect(screen.getByText('19:50 · Ruhetag')).toBeInTheDocument();
    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Shake Klein · Milch 3,5 %');
    expect(items[0]).toHaveTextContent('+240 kcal · +28 g P');
    expect(items[1]).toHaveTextContent('REWE Quarkcreme, 1 Packung');

    await userEvent.click(within(items.at(0) ?? document.body).getByRole('button', { name: /^Eintragen/ }));
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(within(items.at(0) ?? document.body).getByRole('status')).toHaveTextContent('Eingetragen');
    const call = fetchMock.mock.calls.find(([u]) => urlOf(u).endsWith('/entries/shake'));
    expect(call?.[1]?.body).toBe(
      JSON.stringify({ date: '2026-10-19', timeMin: 1200, shake: 'small_milk_high' }),
    );
  });
});
