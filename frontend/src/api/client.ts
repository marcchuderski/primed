/** Typed fetch wrapper for the Primed API (same origin, JSON only). */

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Seconds from the Retry-After header (429). */
    readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const GENERIC_MESSAGE = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.';
const NETWORK_MESSAGE = 'Keine Verbindung. Bitte prüfe dein Internet und versuche es erneut.';

let csrfToken: string | null = null;

/** Kept in memory only (never in localStorage); re-fetched via /auth/me after a reload. */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest(method: Method, path: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET') {
    // The API requires JSON for every state-changing request (CSRF defense).
    headers['Content-Type'] = 'application/json';
    if (csrfToken !== null) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(method === 'GET' ? {} : { body: JSON.stringify(body ?? {}) }),
    });
  } catch {
    throw new ApiError(0, 'network_error', NETWORK_MESSAGE);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await parseJson(response);
  if (!response.ok) {
    const error = readErrorBody(data);
    const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
    throw new ApiError(
      response.status,
      error?.code ?? 'http_error',
      error?.message ?? GENERIC_MESSAGE,
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }

  return data;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    if (response.ok) {
      throw new ApiError(response.status, 'invalid_response', GENERIC_MESSAGE);
    }
    return null;
  }
}

function readErrorBody(data: unknown): ApiErrorBody | null {
  if (!isRecord(data) || !isRecord(data['error'])) {
    return null;
  }
  const { code, message } = data['error'];
  return typeof code === 'string' && typeof message === 'string' ? { code, message } : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
