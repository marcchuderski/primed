import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EssenScreen } from './EssenScreen.tsx';

const base = {
  brand: null,
  barcode: null,
  basis: 'per_100g',
  nutrients: { kcal: 67, protein: 12.4, carbs: 3.2, sugar: 2.6, fat: 0.5 },
  packageAmount: 200,
  usageCount: 3,
  lastAmount: null,
  lastUnit: null,
};
const foods = [
  {
    ...base,
    id: 3,
    type: 'product',
    name: 'REWE Quarkcreme',
    category: 'dairy',
    lastAmount: 1,
    lastUnit: 'packung',
  },
  { ...base, id: 9, type: 'reference', name: 'Magerquark', category: 'dairy', packageAmount: null },
  { ...base, id: 11, type: 'ingredient', name: 'Kidneybohnen', category: 'basics', packageAmount: null },
];

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('EssenScreen library', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      if (method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ food: foods[0] })));
      }
      if (url.includes('/foods/barcode/96385074')) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'not_found', message: 'x' } }), { status: 404 }),
        );
      }
      if (url.includes('/foods/barcode/')) {
        return Promise.resolve(new Response(JSON.stringify({ source: 'library', food: foods[0] })));
      }
      if (url.includes('/off/search')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              products: [
                {
                  barcode: '4006381333931',
                  name: 'Hüttenkäse',
                  brand: 'Milram',
                  category: 'dairy',
                  basis: 'per_100g',
                  nutrients: { kcal: 98, protein: 12, carbs: 3, sugar: 3, fat: 4 },
                  packageAmount: 200,
                },
              ],
            }),
          ),
        );
      }
      if (method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ food: { ...foods[0], id: 50 } }), { status: 201 }),
        );
      }
      const category = new URL(url, 'https://x').searchParams.get('category');
      const list = category === null ? foods : foods.filter((f) => f.category === category);
      return Promise.resolve(new Response(JSON.stringify({ foods: list })));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists all types with tags and filters by category and type', async () => {
    render(<EssenScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Bibliothek' }));

    expect(await screen.findByRole('button', { name: /REWE Quarkcreme/ })).toHaveTextContent('134 kcal');
    expect(screen.getByRole('button', { name: /Magerquark/ })).toHaveTextContent('Richtwert');

    await userEvent.click(screen.getByRole('button', { name: 'Grundnahrung' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Magerquark/ })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Kidneybohnen/ })).toHaveTextContent('Zutat');

    await userEvent.click(screen.getByRole('button', { name: 'Filter nach Typ' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Zutat' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fertig' }));
    expect(screen.getByRole('button', { name: 'Filter nach Typ (aktiv)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kidneybohnen/ })).not.toBeInTheDocument();
    expect(screen.getByText('Typ: Markenprodukt, Richtwert')).toBeInTheDocument();
  });

  it('edits a product and deletes it only after confirmation', async () => {
    render(<EssenScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Bibliothek' }));

    await userEvent.click(await screen.findByRole('button', { name: /REWE Quarkcreme/ }));
    const sheet = screen.getByRole('dialog', { name: 'Produkt bearbeiten' });
    expect(within(sheet).getByRole('textbox', { name: /Name/ })).toHaveValue('REWE Quarkcreme');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Kalorien erhöhen' }));
    expect(within(sheet).getByRole('textbox', { name: 'Kalorien in kcal' })).toHaveValue('87');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true);
    });
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(typeof patch?.[1]?.body === 'string' ? patch[1].body : '{}')).toMatchObject({
      kcal: 87,
      name: 'REWE Quarkcreme',
      basis: 'per_100g',
    });

    await userEvent.click(await screen.findByRole('button', { name: /REWE Quarkcreme/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Produkt löschen' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Produkt löschen?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Löschen' }));
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
    });
  });

  it('scans into the library: unknown codes open "Neues Produkt", known ones open for editing', async () => {
    render(<EssenScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Bibliothek' }));
    await screen.findByRole('button', { name: /REWE Quarkcreme/ });

    await userEvent.click(screen.getByRole('button', { name: 'Barcode scannen' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Barcode eintippen' }), '96385074');
    await userEvent.click(screen.getByRole('button', { name: 'Suchen' }));
    const sheet = await screen.findByRole('dialog', { name: 'Neues Produkt' });
    expect(sheet).toHaveTextContent('Barcode 96385074 wird verknüpft.');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Schließen' }));

    await userEvent.click(screen.getByRole('button', { name: 'Barcode scannen' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Barcode eintippen' }), '4006381333931');
    await userEvent.click(screen.getByRole('button', { name: 'Suchen' }));
    expect(
      await screen.findByRole('dialog', { name: /REWE Quarkcreme|Produkt bearbeiten/ }),
    ).toBeInTheDocument();
  });

  it('creates a new product with the search term as name', async () => {
    render(<EssenScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Bibliothek' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'In Bibliothek suchen' }), 'Hüttenkäse');
    await userEvent.click(screen.getByRole('button', { name: 'Produkt anlegen' }));
    const sheet = await screen.findByRole('dialog', { name: 'Neues Produkt' });
    expect(within(sheet).getByRole('textbox', { name: /Name/ })).toHaveValue('Hüttenkäse');
    expect(within(sheet).getByRole('button', { name: 'In Bibliothek speichern' })).toBeInTheDocument();
  });

  it('shows online hits like "Zutat suchen" and saves one into the library after checking', async () => {
    render(<EssenScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Bibliothek' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'In Bibliothek suchen' }), 'Hütten');
    const online = await screen.findByRole('region', { name: 'Online-Treffer' });
    await userEvent.click(within(online).getByRole('button', { name: /Hüttenkäse/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Neues Produkt' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'In Bibliothek speichern' }));
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
    });
  });
});
