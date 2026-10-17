import { ApiError, apiRequest, isRecord, setCsrfToken } from './client.ts';

export interface User {
  id: number;
  username: string;
  displayName: string;
}

function parseSession(data: unknown): User {
  if (isRecord(data) && isRecord(data['user']) && typeof data['csrfToken'] === 'string') {
    const { id, username, displayName } = data['user'];
    if (typeof id === 'number' && typeof username === 'string' && typeof displayName === 'string') {
      setCsrfToken(data['csrfToken']);
      return { id, username, displayName };
    }
  }
  throw new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');
}

/** Returns the current user, or null if not logged in. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return parseSession(await apiRequest('GET', '/auth/me'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}

export async function login(username: string, password: string): Promise<User> {
  return parseSession(await apiRequest('POST', '/auth/login', { username, password }));
}

export async function logout(): Promise<void> {
  await apiRequest('POST', '/auth/logout');
  setCsrfToken(null);
}

function parseUser(data: unknown): User {
  if (isRecord(data) && isRecord(data['user'])) {
    const { id, username, displayName } = data['user'];
    if (typeof id === 'number' && typeof username === 'string' && typeof displayName === 'string') {
      return { id, username, displayName };
    }
  }
  throw new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');
}

export async function updateProfile(displayName: string, username: string): Promise<User> {
  return parseUser(await apiRequest('PATCH', '/profile', { displayName, username }));
}

/** Other sessions end; this one stays (BRIEFING §13). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest('POST', '/auth/password', { currentPassword, newPassword });
}

/** Deletes the account and all its data (D-082). */
export async function deleteAccount(password: string): Promise<void> {
  await apiRequest('POST', '/account/delete', { password });
  setCsrfToken(null);
}

export async function logoutEverywhere(): Promise<void> {
  await apiRequest('POST', '/auth/logout-all');
  setCsrfToken(null);
}
