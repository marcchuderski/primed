import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Day } from '../../api/days.ts';
import { AddFlow } from '../add/AddFlow.tsx';
import { DishesView } from './DishesView.tsx';

const n = (kcal: number, protein: number) => ({ kcal, protein, carbs: 10, sugar: 1, fat: 5 });
const chili = {
  id: 7,
  name: 'Chili',
  cookedOn: '2026-10-18',
  portionsTotal: 4,
  portionsLeft: 2.5,
  status: 'active',
  totals: n(2400, 160),
  perPortion: n(600, 40),
  basedOnDishId: null,
  ingredients: [
    {
      foodId: 1,
      name: 'Reis, roh',
      foodType: 'reference',
      amount: 400,
      unit: 'g',
      quantity: 400,
      basis: 'per_100g',
      nutrients: n(1404, 31.6),
    },
  ],
};
const archived = { ...chili, id: 6, name: 'Curry', portionsLeft: 0, status: 'archived' };
const rice = {
  id: 1,
  type: 'reference',
  name: 'Reis, roh',
  brand: null,
  barcode: null,
  category: 'grains',
  basis: 'per_100g',
  nutrients: { kcal: 351, protein: 7.9, carbs: 77.1, sugar: 0.3, fat: 0.6 },
  packageAmount: null,
  usageCount: 0,
  lastAmount: null,
  lastUnit: null,
};

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('Dishes UI', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      if (url.includes('/dishes?status=active')) return respond({ dishes: [chili] });
      if (url.includes('/dishes?status=archived')) return respond({ dishes: [archived] });
      if (url.endsWith('/dishes/6')) return respond({ dish: archived });
      if (url.endsWith('/dishes/7')) return respond({ dish: chili });
      if (url.endsWith('/dishes/7/discard'))
        return respond({ dish: { ...chili, status: 'discarded', portionsLeft: 0 } });
      if (url.endsWith('/dishes') && method === 'POST') return respond({ dish: { ...chili, id: 9 } }, 201);
      if (url.includes('/foods?')) return respond({ foods: [rice] });
      if (url.endsWith('/shakes')) return respond({ shakes: [] });
      if (url.endsWith('/foods/frequent')) return respond({ foods: [] });
      if (url.endsWith('/entries/dish')) {
        return respond(
          {
            entry: {
              id: 1,
              date: '2026-10-19',
              timeMin: 780,
              kind: 'dish',
              foodId: null,
              dishId: 7,
              name: 'Chili',
              amount: 1.5,
              unit: 'portion',
              quantity: 1.5,
              nutrients: n(900, 60),
              basis: null,
              packageAmount: null,
            },
          },
          201,
        );
      }
      return respond({ error: { code: 'x', message: `unexpected ${method} ${url}` } }, 500);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function body(path: string): unknown {
    const call = [...fetchMock.mock.calls].reverse().find(([u]) => urlOf(u).endsWith(path));
    const b = call?.[1]?.body;
    return typeof b === 'string' ? (JSON.parse(b) as unknown) : null;
  }

  it('shows dishes with portions left and creates a new dish from ingredients', async () => {
    render(<DishesView />);
    expect(await screen.findByRole('button', { name: /Chili, 2,5 von 4 Portionen übrig/ })).toHaveTextContent(
      '600',
    );

    await userEvent.click(screen.getByRole('button', { name: /Neues Gericht kochen/ }));
    const editor = screen.getByRole('dialog', { name: 'Neues Gericht' });
    expect(
      within(editor).getByText(/Noch keine Zutaten\. Suche sie in deiner Bibliothek/),
    ).toBeInTheDocument();
    expect(within(editor).getByRole('button', { name: 'Zutat hinzufügen' })).toBeInTheDocument();
    await userEvent.type(within(editor).getByRole('textbox', { name: /Name/ }), 'Reispfanne');
    await userEvent.click(within(editor).getByRole('button', { name: /Suchen/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Reis, roh/ }));
    const amount = screen.getByRole('dialog', { name: 'Reis, roh' });
    await userEvent.click(within(amount).getByRole('button', { name: 'Zur Zutatenliste hinzufügen' }));

    expect(within(editor).getByText('Zutaten · 1')).toBeInTheDocument();
    await userEvent.click(within(editor).getByRole('button', { name: 'Weniger Portionen' }));
    await userEvent.click(within(editor).getByRole('button', { name: /Zu den Gerichten · 3,5 Portionen/ }));
    await waitFor(() => {
      expect(body('/dishes')).toEqual({
        name: 'Reispfanne',
        portions: 3.5,
        ingredients: [{ foodId: 1, amount: 100, unit: 'g' }],
        basedOnDishId: null,
      });
    });
  });

  it('cooks an archived dish again with its ingredients prefilled', async () => {
    render(<DishesView />);
    await userEvent.click(await screen.findByRole('button', { name: /Archiv/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Nochmal kochen' }));

    const editor = await screen.findByRole('dialog', { name: 'Neues Gericht' });
    expect(within(editor).getByRole('textbox', { name: /Name/ })).toHaveValue('Curry');
    expect(within(editor).getByRole('button', { name: /Reis, roh, 400 g/ })).toBeInTheDocument();
    await userEvent.click(within(editor).getByRole('button', { name: /Zu den Gerichten/ }));
    await waitFor(() => {
      expect(body('/dishes')).toMatchObject({ name: 'Curry', basedOnDishId: 6 });
    });
  });

  it('discards the rest only after confirmation', async () => {
    render(<DishesView />);
    await userEvent.click(await screen.findByRole('button', { name: /Chili, 2,5 von 4/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Rest entsorgen' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Rest entsorgen?' });
    expect(dialog).toHaveTextContent('Die restlichen 2,5 Portionen werden nicht eingetragen.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Entsorgen' }));
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([u]) => urlOf(u).endsWith('/dishes/7/discard'))).toBe(true);
    });
  });

  it('logs half portions from the "+" sheet', async () => {
    const day: Day = {
      date: '2026-10-19',
      isToday: true,
      editable: true,
      dayTypeId: 1,
      dayTypeName: 'Ruhetag',
      isTraining: false,
      trainingStart: null,
      durationMin: null,
      source: 'template',
      statsExcluded: false,
      targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
    };
    const onAdded = vi.fn();
    render(
      <AddFlow
        day={day}
        eatenBefore={{ kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }}
        onClose={vi.fn()}
        onAdded={onAdded}
      />,
    );

    const dishes = await screen.findByRole('region', { name: 'Gerichte' });
    await userEvent.click(within(dishes).getByRole('button', { name: /Chili/ }));
    const sheet = screen.getByRole('dialog', { name: 'Chili' });
    await userEvent.click(within(sheet).getByRole('button', { name: '1,5 Portionen' }));
    expect(within(sheet).getByText('900')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /^Hinzufügen/ }));
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(body('/entries/dish')).toMatchObject({ dishId: 7, portions: 1.5, date: '2026-10-19' });
  });
});
