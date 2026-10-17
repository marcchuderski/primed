import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.tsx';
import { setCsrfToken } from './api/client.ts';

const marc = { id: 1, username: 'marcch', displayName: 'Marc' };

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('App auth flow', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    setCsrfToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a neutral startup screen, then the login screen without a forgot-password link', async () => {
    fetchMock.mockResolvedValueOnce(
      json(401, { error: { code: 'unauthenticated', message: 'Bitte melde dich an.' } }),
    );
    render(<App />);

    expect(screen.getByRole('main', { name: 'Primed lädt' })).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByRole('heading', { name: 'Willkommen zurück.' })).toBeInTheDocument();
    expect(screen.getByText('Primed for performance.')).toBeInTheDocument();
    expect(screen.queryByText(/Passwort vergessen/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Einloggen' })).toBeDisabled();
  });

  it('logs in, shows the home screen and logs out with the CSRF token', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(401, { error: { code: 'unauthenticated', message: 'Bitte melde dich an.' } }),
      )
      .mockResolvedValueOnce(json(200, { user: marc, csrfToken: 'csrf-abc' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    render(<App />);

    await userEvent.type(await screen.findByLabelText('Username'), 'marcch');
    await userEvent.type(screen.getByLabelText('Passwort'), 'Kaffee mit Hafermilch 2026');
    await userEvent.click(screen.getByRole('button', { name: 'Einloggen' }));

    expect(await screen.findByRole('heading', { name: 'Hey, Marc.' })).toBeInTheDocument();
    const loginBody = fetchMock.mock.calls[1]?.[1]?.body;
    expect(typeof loginBody === 'string' ? (JSON.parse(loginBody) as unknown) : null).toEqual({
      username: 'marcch',
      password: 'Kaffee mit Hafermilch 2026',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }));
    expect(await screen.findByRole('heading', { name: 'Willkommen zurück.' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/v1/auth/logout');
    expect(fetchMock.mock.calls[2]?.[1]?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-abc' });
  });

  it('shows a generic error, clears the password and explains rate limiting', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(401, { error: { code: 'unauthenticated', message: 'Bitte melde dich an.' } }),
      )
      .mockResolvedValueOnce(
        json(401, { error: { code: 'invalid_credentials', message: 'Username oder Passwort ist falsch.' } }),
      )
      .mockResolvedValueOnce(
        json(
          429,
          { error: { code: 'too_many_attempts', message: 'Zu viele Versuche.' } },
          { 'Retry-After': '840' },
        ),
      );
    render(<App />);

    const password = screen.getByLabelText.bind(screen, 'Passwort');
    await userEvent.type(await screen.findByLabelText('Username'), 'marcch');
    await userEvent.type(password(), 'falsch falsch');
    await userEvent.click(screen.getByRole('button', { name: 'Einloggen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Username oder Passwort ist falsch.');
    expect(password()).toHaveValue('');

    await userEvent.type(password(), 'nochmal falsch');
    await userEvent.click(screen.getByRole('button', { name: 'Einloggen' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Bitte warte 14 Minuten');
    });
  });

  it('restores an existing session', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { user: marc, csrfToken: 'csrf-x' }));
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Hey, Marc.' })).toBeInTheDocument();
  });

  it('offers a retry when the server is unreachable', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json(200, { user: marc, csrfToken: 'csrf-y' }));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Keine Verbindung');
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByRole('heading', { name: 'Hey, Marc.' })).toBeInTheDocument();
  });
});
