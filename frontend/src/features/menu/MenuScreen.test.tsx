import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import promptDoc from '../../../../docs/RICHTWERTE-PROMPT.md?raw';
import { AuthContext, type AuthContextValue } from '../auth/useAuth.ts';
import { testSettings } from '../../test/fixtures.ts';
import { AI_LINKS, GUIDANCE_PROMPT } from './guidancePrompt.ts';
import { MenuScreen } from './MenuScreen.tsx';

const marc = { id: 1, username: 'marcch', displayName: 'Marc' };
const type = (id: number, name: string, isTraining: boolean, isRest = false) => ({
  id,
  name,
  kcal: 2600,
  protein: null,
  effectiveProtein: 150,
  carbs: 350,
  sugarRef: 50,
  isTraining,
  sort: id,
  isRest,
});
const types = [type(1, 'Ruhetag', false, true), type(4, 'Normal · Basketball', true)];
const template = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  dayTypeId: weekday === 2 || weekday === 4 ? 4 : 1,
  trainingStart: weekday === 2 || weekday === 4 ? 1200 : null,
  durationMin: weekday === 2 || weekday === 4 ? 90 : null,
}));

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

describe('Menu and settings (7.1)', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }));
  const auth: AuthContextValue = {
    state: { status: 'authenticated', user: marc },
    login: vi.fn(),
    logout: vi.fn(),
    logoutEverywhere: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    retry: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    document.documentElement.removeAttribute('data-theme');
    fetchMock.mockImplementation((input, init) => {
      const url = urlOf(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/settings') && method === 'GET') return respond({ settings: testSettings });
      if (url.endsWith('/settings') && method === 'PATCH') {
        const patch = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as Record<
          string,
          unknown
        >;
        return respond({ settings: { ...testSettings, ...patch } });
      }
      if (url.endsWith('/day-types') && method === 'GET') return respond({ dayTypes: types });
      if (url.endsWith('/day-types') && method === 'POST')
        return respond({ dayType: type(9, 'Yoga', true) }, 201);
      if (url.endsWith('/day-types/1')) return respond({ dayType: types[0] });
      if (url.endsWith('/week-template') && method === 'GET') return respond({ days: template });
      if (url.endsWith('/week-template') && method === 'PUT') {
        return respond(JSON.parse(typeof init?.body === 'string' ? init.body : '{}'));
      }
      return respond({ error: { code: 'x', message: `unexpected ${method} ${url}` } }, 500);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function body(path: string, method: string): unknown {
    const call = [...fetchMock.mock.calls]
      .reverse()
      .find(([u, init]) => urlOf(u).endsWith(path) && init?.method === method);
    const b = call?.[1]?.body;
    return typeof b === 'string' ? (JSON.parse(b) as unknown) : null;
  }

  function renderMenu() {
    return render(
      <AuthContext.Provider value={auth}>
        <MenuScreen user={marc} onClose={vi.fn()} />
      </AuthContext.Provider>,
    );
  }

  it('shows profile and setting summaries and switches the theme', async () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /Marc.*@marcch · Profil bearbeiten/ })).toBeInTheDocument();
    expect(await screen.findByText('Di + Do Basketball 20:00')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Bereit für heute.');
    expect(screen.getByText('Bis 3 h vor Training: 70 %')).toBeInTheDocument();
    expect(screen.getByText('2 Tagesarten · kcal, Protein, KH')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dunkel' }));
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dunkel' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => {
      expect(body('/settings', 'PATCH')).toEqual({ theme: 'dark' });
    });

    await userEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('saves the protein default after the last tap', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Tagesarten & Sollwerte/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Protein erhöhen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Protein erhöhen' }));
    expect(screen.getByRole('group', { name: 'Protein' })).toHaveTextContent('160 g');
    await waitFor(
      () => {
        expect(body('/settings', 'PATCH')).toEqual({ proteinDefault: 160 });
      },
      { timeout: 2000 },
    );
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1);
  });

  it('keeps name and kind of the rest day fixed and creates new day types', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Tagesarten & Sollwerte/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Ruhetag/ }));
    const rest = screen.getByRole('dialog', { name: 'Ruhetag' });
    expect(within(rest).queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
    expect(within(rest).queryByRole('button', { name: 'Tagesart löschen' })).not.toBeInTheDocument();
    await userEvent.click(within(rest).getByRole('button', { name: 'Kalorien verringern' }));
    await userEvent.click(within(rest).getByRole('button', { name: 'Speichern' }));
    await waitFor(() => {
      expect(body('/day-types/1', 'PATCH')).toMatchObject({ name: 'Ruhetag', kcal: 2550, isTraining: false });
    });

    await userEvent.click(screen.getByRole('button', { name: /Neue Tagesart/ }));
    const created = screen.getByRole('dialog', { name: 'Neue Tagesart' });
    await userEvent.type(within(created).getByRole('textbox', { name: 'Name' }), 'Yoga');
    await userEvent.click(within(created).getByRole('button', { name: 'Tagesart anlegen' }));
    await waitFor(() => {
      expect(body('/day-types', 'POST')).toEqual({
        name: 'Yoga',
        kcal: 2400,
        protein: null,
        carbs: 250,
        sugarRef: 50,
        isTraining: true,
      });
    });
  });

  it('opens the changelog; its newest version is the app version', async () => {
    renderMenu();
    const link = await screen.findByRole('button', { name: /^Changelog/ });
    expect(link).toHaveTextContent(`Version ${__APP_VERSION__}`);
    await userEvent.click(link);
    expect(screen.getByRole('heading', { level: 1, name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: `Version ${__APP_VERSION__}` })).toHaveTextContent(
      '20.10.2026',
    );
    expect(screen.getByRole('region', { name: 'Version 1.0.0' })).toHaveTextContent(
      'Erste Version: Tagesziele',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Menü' })).toBeInTheDocument();
  });

  it('opens "Richtwerte ermitteln" with the questionnaire, copy button, start-page links and hints', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Tagesarten & Sollwerte/ }));
    await userEvent.click(screen.getByRole('button', { name: /Hilfe beim Ermitteln deiner Richtwerte/ }));
    const sheet = screen.getByRole('dialog', { name: 'Richtwerte ermitteln' });

    await userEvent.click(within(sheet).getByRole('button', { name: /Fragebogen kopieren/ }));
    expect(writeText).toHaveBeenCalledWith(GUIDANCE_PROMPT);
    expect(within(sheet).getByRole('button', { name: /Kopiert/ })).toBeInTheDocument();

    for (const link of AI_LINKS) {
      const a = within(sheet).getByRole('link', { name: new RegExp(link.name) });
      expect(a).toHaveAttribute('href', link.href);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(new URL(link.href).pathname).toBe('/');
    }
    expect(sheet).toHaveTextContent('Kein Ersatz für ärztliche oder ernährungsfachliche Beratung.');
    expect(sheet).toHaveTextContent(
      'Deine Antworten gehen an den Anbieter, den du wählst. Primed sendet dabei nichts.',
    );
  });

  it('falls back to selectable text when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Tagesarten & Sollwerte/ }));
    await userEvent.click(screen.getByRole('button', { name: /Hilfe beim Ermitteln/ }));
    await userEvent.click(screen.getByRole('button', { name: /Fragebogen kopieren/ }));
    expect(await screen.findByRole('textbox', { name: 'Fragebogen' })).toHaveValue(GUIDANCE_PROMPT);
  });

  it('keeps the questionnaire in sync with docs/RICHTWERTE-PROMPT.md', () => {
    const block = /```\n([\s\S]*?)\n```/.exec(promptDoc)?.[1];
    expect(block).toBe(GUIDANCE_PROMPT);
  });

  it('changes one weekday of the week template', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Wochenvorlage/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Mittwoch/ }));
    const sheet = screen.getByRole('dialog', { name: 'Mittwoch' });
    await userEvent.click(await within(sheet).findByRole('button', { name: /Normal · Basketball/ }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Übernehmen' }));
    await waitFor(() => {
      expect(body('/week-template', 'PUT')).toMatchObject({
        days: expect.arrayContaining([
          { weekday: 3, dayTypeId: 4, trainingStart: 1080, durationMin: 90 },
        ]) as unknown,
      });
    });
    expect(await screen.findByText('Normal · Basketball · 18:00 · 90 min')).toBeInTheDocument();
  });

  it('saves checkpoint and threshold settings as partial updates', async () => {
    const { unmount } = renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /Checkpoints/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Anteil erhöhen' }));
    // Leaving right away still saves (flush on close).
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    await waitFor(() => {
      expect(body('/settings', 'PATCH')).toEqual({
        checkpoint: { offsetMin: 180, pct: 75, earliestMin: 360 },
        earliestTrainingMin: 540,
      });
    });

    await userEvent.click(await screen.findByRole('button', { name: /^Shakes/ }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Abend-Shake an Ruhetagen, ab dieser Uhrzeit erhöhen' }),
    );
    expect(screen.getByText('19:15')).toBeInTheDocument();
    unmount();
    await waitFor(() => {
      expect(body('/settings', 'PATCH')).toMatchObject({
        thresholds: { restShakeFrom: 1155, minProteinGap: 25 },
      });
    });
  });

  it('deletes the account only after password and confirmation', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Profil bearbeiten/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Konto löschen' }));
    const sheet = screen.getByRole('dialog', { name: 'Konto löschen' });
    expect(within(sheet).getByRole('button', { name: 'Weiter' })).toBeDisabled();
    await userEvent.type(within(sheet).getByLabelText('Passwort'), 'Kaffee mit Hafermilch 2026');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Weiter' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Konto endgültig löschen?' });
    expect(auth.deleteAccount).not.toHaveBeenCalled();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Endgültig löschen' }));
    expect(auth.deleteAccount).toHaveBeenCalledWith('Kaffee mit Hafermilch 2026');
  });

  it('updates the profile', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Profil bearbeiten/ }));
    const name = await screen.findByLabelText('Display-Name');
    // D-152: the username is shown, but there is no field to change it.
    expect(screen.getByText('@marcch')).toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Profil speichern' })).toBeDisabled();
    await userEvent.clear(name);
    await userEvent.type(name, 'Marc C.');
    await userEvent.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(auth.updateProfile).toHaveBeenCalledWith('Marc C.');
  });

  it('lists the settings in the agreed order', async () => {
    renderMenu();
    await screen.findByText('Di + Do Basketball 20:00');
    const card = screen.getByRole('heading', { name: 'Einstellungen' }).parentElement;
    const names = within(card ?? document.body)
      .getAllByRole('button')
      .map((b) => b.textContent);
    const order = ['Tagesarten & Sollwerte', 'Wochenvorlage', 'Checkpoints', 'Bewertung', 'Shakes'];
    expect(names).toHaveLength(order.length);
    expect(names.map((n, idx) => n.startsWith(order[idx] ?? '-'))).toEqual(order.map(() => true));
  });

  it('switches shakes off and hides their settings', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /^Shakes/ }));
    expect(screen.getByText(/Shakes sind Schnell-Einträge/)).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'Shakes verwenden' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Aktuelles Proteinpulver')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vorschläge' })).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Aktuelles Proteinpulver')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vorschläge' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(body('/settings', 'PATCH')).toEqual({ shakesEnabled: false });
    });
  });

  it('toggles liquids as pills and keeps at least one', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /^Shakes/ }));
    const water = screen.getByRole('button', { name: 'Wasser' });
    expect(water).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(water);
    expect(water).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => {
      expect(body('/settings', 'PATCH')).toEqual({ shake: { liquids: { water: false } } });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Milch 3,5 %' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Milch 1,5 %' })).toBeDisabled();
    });
  });

  it('offers scanning and creating a product from the powder picker', async () => {
    renderMenu();
    await userEvent.click(await screen.findByRole('button', { name: /^Shakes/ }));
    await userEvent.click(screen.getByRole('button', { name: /Aktuelles Proteinpulver/ }));
    const picker = screen.getByRole('dialog', { name: /Aktuelles Proteinpulver/ });
    expect(within(picker).getByRole('button', { name: 'Barcode scannen' })).toBeInTheDocument();
    expect(within(picker).getByRole('button', { name: /Scannen/ })).toBeInTheDocument();
    await userEvent.type(within(picker).getByLabelText('Bibliothek durchsuchen'), 'Whey');
    await userEvent.click(within(picker).getByRole('button', { name: /Produkt anlegen/ }));
    const product = await screen.findByRole('dialog', { name: /Neues Produkt/ });
    expect(within(product).getByDisplayValue('Whey')).toBeInTheDocument();
  });
});
