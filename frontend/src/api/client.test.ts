import { ApiError, apiRequest, setCsrfToken } from './client.ts';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('apiRequest', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    setCsrfToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends GET requests same-origin without a body or CSRF header', async () => {
    setCsrfToken('csrf-1');
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await expect(apiRequest('GET', '/auth/me')).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/v1/auth/me');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.body).toBeUndefined();
    expect(init?.headers).not.toHaveProperty('X-CSRF-Token');
  });

  it('sends JSON and the CSRF token for state-changing requests', async () => {
    setCsrfToken('csrf-2');
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest('POST', '/auth/logout')).resolves.toBeNull();

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-2' });
    expect(init?.body).toBe('{}');
  });

  it('turns API errors into ApiError with code, message and Retry-After', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        429,
        { error: { code: 'too_many_attempts', message: 'Zu viele Versuche.' } },
        { 'Retry-After': '840' },
      ),
    );

    await expect(apiRequest('POST', '/auth/login', {})).rejects.toMatchObject({
      status: 429,
      code: 'too_many_attempts',
      message: 'Zu viele Versuche.',
      retryAfter: 840,
    });
  });

  it('uses a generic message when the error body is not the expected shape', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await apiRequest('GET', '/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).not.toContain('html');
  });

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('GET', '/x')).rejects.toMatchObject({ status: 0, code: 'network_error' });
  });
});
