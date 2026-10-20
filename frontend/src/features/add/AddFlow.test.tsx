import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Day } from '../../api/days.ts';
import { AddFlow } from './AddFlow.tsx';

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
const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };

const food = (over: Record<string, unknown>) => ({
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
  ...over,
});
const quark = food({});
const skyrRef = food({
  id: 9,
  type: 'reference',
  name: 'Skyr natur',
  packageAmount: null,
  lastAmount: null,
  lastUnit: null,
});
const offSkyr = {
  barcode: '4006381333931',
  name: 'Skyr Natur',
  brand: 'Milram',
  category: 'dairy',
  basis: 'per_100g',
  nutrients: { kcal: 64, protein: 11, carbs: 4, sugar: 4, fat: 0.2 },
  packageAmount: 450,
};
const shakes = [
  {
    id: 'big_milk_low',
    size: 'big',
    liquid: 'milk_low',
    name: 'Shake Groß · Milch 1,5 %',
    label: 'Groß · Milch 1,5 %',
    nutrients: { kcal: 300.2, protein: 35.2, carbs: 21, sugar: 20.8, fat: 7.6 },
  },
];
const entry = (over: Record<string, unknown>) => ({
  id: 50,
  date: '2026-10-19',
  timeMin: 870,
  kind: 'food',
  foodId: 3,
  dishId: null,
  name: 'REWE Quarkcreme',
  amount: 1,
  unit: 'packung',
  quantity: 200,
  nutrients: { kcal: 134, protein: 24.8, carbs: 6.4, sugar: 5.2, fat: 1 },
  basis: 'per_100g',
  packageAmount: 200,
  ...over,
});

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('AddFlow', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-19T12:38:00Z')); // 14:38 Berlin → 14:45
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/shakes')) return respond({ shakes });
      if (url.endsWith('/foods/frequent')) return respond({ foods: [quark] });
      if (url.includes('/foods?q=')) return respond({ foods: [quark, skyrRef] });
      if (url.includes('/references?q=')) return respond({ references: [] });
      if (url.includes('/off/search')) return respond({ products: [offSkyr] });
      if (url.includes('/foods/barcode/96385074'))
        return respond({ error: { code: 'not_found', message: 'x' } }, 404);
      if (url.endsWith('/foods') && method === 'POST')
        return respond({ food: food({ id: 77, name: 'Skyr Natur', barcode: '4006381333931' }) }, 201);
      if (url.endsWith('/entries/shake'))
        return respond({ entry: entry({ kind: 'shake', name: 'Shake Groß', foodId: null }) }, 201);
      if (url.endsWith('/entries') && method === 'POST') return respond({ entry: entry({}) }, 201);
      return respond({ error: { code: 'x', message: `unexpected ${url}` } }, 500);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function setup() {
    const onAdded = vi.fn();
    render(<AddFlow day={day} eatenBefore={zero} onClose={vi.fn()} onAdded={onAdded} />);
    return onAdded;
  }

  function lastBody(path: string): unknown {
    const call = [...fetchMock.mock.calls].reverse().find(([u]) => urlOf(u).endsWith(path));
    const body = call?.[1]?.body;
    return typeof body === 'string' ? (JSON.parse(body) as unknown) : null;
  }

  it('shows shakes and "Häufig um diese Zeit" with the last amount', async () => {
    setup();
    expect(
      await screen.findByRole('button', {
        name: /Shake Groß · Milch 1,5 % eintragen: 300 kcal, 35 g Protein/,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('134 kcal ·', { exact: false })).toHaveTextContent('1 Packung');
  });

  it('logs a shake with one tap at the rounded current time', async () => {
    const onAdded = setup();
    await userEvent.click(await screen.findByRole('button', { name: /Shake Groß · Milch 1,5 % eintragen/ }));
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(lastBody('/entries/shake')).toEqual({ date: '2026-10-19', timeMin: 885, shake: 'big_milk_low' });
  });

  it('searches library, online and reference values in tabs with hit counts and logs with the prefilled amount, also for yesterday', async () => {
    const onAdded = setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Lebensmittel suchen' }), 'skyr');

    const tabs = await screen.findByRole('group', { name: 'Treffer' });
    expect(await within(tabs).findByRole('button', { name: 'Bibliothek 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      await within(tabs).findByRole('button', { name: 'Online 1' }, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Richtwerte' })).not.toBeInTheDocument();

    await userEvent.click(within(tabs).getByRole('button', { name: 'Richtwerte 1' }));
    expect(screen.getByRole('region', { name: 'Richtwerte' })).toHaveTextContent('Skyr natur');
    expect(screen.queryByRole('region', { name: 'Deine Bibliothek' })).not.toBeInTheDocument();
    await userEvent.click(within(tabs).getByRole('button', { name: 'Online 1' }));
    expect(screen.getByRole('region', { name: 'Online-Treffer' })).toHaveTextContent('Milram Skyr Natur');

    await userEvent.click(within(tabs).getByRole('button', { name: 'Bibliothek 1' }));
    const library = screen.getByRole('region', { name: 'Deine Bibliothek' });
    expect(within(library).getByText('REWE Quarkcreme')).toBeInTheDocument();
    await userEvent.click(within(library).getByRole('button', { name: /REWE Quarkcreme/ }));
    const sheet = screen.getByRole('dialog', { name: 'REWE Quarkcreme' });
    expect(within(sheet).getByLabelText(/Menge in/)).toHaveValue('1');
    await userEvent.selectOptions(within(sheet).getByRole('combobox'), 'Gestern');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Hinzufügen · 14:45' }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(lastBody('/entries')).toEqual({
      date: '2026-10-18',
      timeMin: 885,
      foodId: 3,
      amount: 1,
      unit: 'packung',
    });
  });

  it('saves an online product to the library before logging it', async () => {
    const onAdded = setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Lebensmittel suchen' }), 'skyr');
    await userEvent.click(await screen.findByRole('button', { name: 'Online 1' }, { timeout: 2000 }));
    const online = screen.getByRole('region', { name: 'Online-Treffer' });
    await userEvent.click(
      await within(online).findByRole('button', { name: /Milram Skyr Natur/ }, { timeout: 2000 }),
    );

    const sheet = screen.getByRole('dialog', { name: 'Milram Skyr Natur' });
    expect(within(sheet).getByText('Milchprodukte · Neu · wird gespeichert')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /^Hinzufügen/ }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(lastBody('/foods')).toMatchObject({
      barcode: '4006381333931',
      source: 'off',
      name: 'Skyr Natur',
      brand: 'Milram',
    });
    expect(lastBody('/entries')).toMatchObject({ foodId: 77, amount: 100, unit: 'g' });
  });

  it('opens "Neues Produkt" with the barcode when a scanned product is unknown', async () => {
    setup();
    await userEvent.click(screen.getAllByRole('button', { name: /Barcode scannen/ }).at(0) ?? document.body);
    await userEvent.type(screen.getByRole('textbox', { name: 'Barcode eintippen' }), '96385074');
    await userEvent.click(screen.getByRole('button', { name: 'Suchen' }));

    expect(await screen.findByRole('dialog', { name: 'Neues Produkt' })).toHaveTextContent(
      'Barcode 96385074 wird verknüpft.',
    );
  });
  it('jumps to the first tab with hits and shows reference values like milk there', async () => {
    fetchMock.mockImplementation((input) => {
      const url = urlOf(input);
      if (url.endsWith('/shakes')) return respond({ shakes });
      if (url.endsWith('/foods/frequent')) return respond({ foods: [] });
      if (url.includes('/foods?q='))
        return respond({ foods: [food({ id: 4, type: 'reference', name: 'Milch 1,5 %' })] });
      if (url.includes('/references?q=')) return respond({ references: [] });
      if (url.includes('/off/search')) return respond({ products: [] });
      return respond({ error: { code: 'x', message: `unexpected ${url}` } }, 500);
    });
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Lebensmittel suchen' }), 'milch');

    expect(await screen.findByRole('button', { name: 'Richtwerte 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('region', { name: 'Richtwerte' })).toHaveTextContent('Milch 1,5 %');
    expect(await screen.findByRole('button', { name: 'Online 0' }, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bibliothek 0' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adopts a shared reference value and prefills one piece with its weight', async () => {
    const roll = {
      id: 5,
      name: 'Weizenbrötchen',
      category: 'grains',
      basis: 'per_100g',
      nutrients: { kcal: 270, protein: 9, carbs: 54, sugar: 2, fat: 1.5 },
      pieceWeight: 60,
    };
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      if (url.endsWith('/shakes')) return respond({ shakes });
      if (url.endsWith('/foods/frequent')) return respond({ foods: [] });
      if (url.includes('/foods?q=')) return respond({ foods: [] });
      if (url.includes('/references?q=')) return respond({ references: [roll] });
      if (url.includes('/off/search')) return respond({ products: [] });
      if (url.endsWith('/references/5/adopt') && init?.method === 'POST')
        return respond({
          food: food({
            id: 41,
            type: 'reference',
            name: 'Weizenbrötchen',
            category: 'grains',
            nutrients: roll.nutrients,
            packageAmount: null,
            pieceWeight: 60,
            lastAmount: null,
            lastUnit: null,
          }),
        });
      if (url.endsWith('/entries') && init?.method === 'POST') return respond({ entry: entry({}) }, 201);
      return respond({ error: { code: 'x', message: `unexpected ${url}` } }, 500);
    });
    const onAdded = setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Lebensmittel suchen' }), 'brötchen');

    expect(await screen.findByRole('button', { name: 'Richtwerte 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const region = screen.getByRole('region', { name: 'Richtwerte' });
    expect(region).toHaveTextContent('1 Stück ≈ 60 g');
    await userEvent.click(within(region).getByRole('button', { name: /Weizenbrötchen/ }));

    const sheet = await screen.findByRole('dialog', { name: 'Weizenbrötchen' });
    expect(within(sheet).getByLabelText(/Menge in/)).toHaveValue('1');
    expect(within(sheet).getByRole('button', { name: 'Stück' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sheet).getByRole('button', { name: 'g' })).toBeEnabled();
    expect(within(sheet).getByText('= 60 g · 1 Stück = 60 g')).toBeInTheDocument();
    expect(within(sheet).getByText('162')).toBeInTheDocument(); // 60 g × 2.7 kcal

    await userEvent.click(within(sheet).getByRole('button', { name: /^Hinzufügen/ }));
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    expect(lastBody('/entries')).toMatchObject({ foodId: 41, amount: 1, unit: 'stueck' });
  });

  it('selects the whole amount on focus, so typing replaces it', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Lebensmittel suchen' }), 'skyr');
    await userEvent.click(await screen.findByRole('button', { name: /REWE Quarkcreme/ }));
    const amount = within(screen.getByRole('dialog', { name: 'REWE Quarkcreme' })).getByLabelText(/Menge in/);
    expect(amount).toHaveValue('1');

    await userEvent.click(amount);
    await userEvent.keyboard('2');
    expect(amount).toHaveValue('2');
  });
});
