/** Account API client. Maps snake_case payloads to camelCase for the UI. */

export interface Account {
  publicId: string;
  isPublic: boolean;
  createdAt: string;
}

export interface AccountWithToken extends Account {
  accessToken: string;
}

export interface CreatedAccount extends AccountWithToken {
  mnemonic: string;
}

const TOKEN_KEY = 'notmice.access_token';

interface AccountViewPayload {
  public_id: string;
  is_public: boolean;
  created_at: string;
}

interface SessionPayload extends AccountViewPayload {
  access_token: string;
  token_type: string;
}

interface CreatedPayload extends SessionPayload {
  mnemonic: string;
}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}${path}`;
}

function mapAccount(payload: AccountViewPayload): Account {
  return {
    publicId: payload.public_id,
    isPublic: payload.is_public,
    createdAt: payload.created_at,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
  } catch {
    // Fall through to status text.
  }
  return `Request failed (${response.status})`;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as T;
}

function jsonHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function createAccount(): Promise<CreatedAccount> {
  const payload = await requestJson<CreatedPayload>('/api/v1/accounts', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  return {
    ...mapAccount(payload),
    accessToken: payload.access_token,
    mnemonic: payload.mnemonic,
  };
}

export async function loginWithMnemonic(mnemonic: string): Promise<AccountWithToken> {
  const payload = await requestJson<SessionPayload>('/api/v1/accounts/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ mnemonic }),
  });
  return {
    ...mapAccount(payload),
    accessToken: payload.access_token,
  };
}

export async function logoutAccount(token: string): Promise<void> {
  await requestJson<void>('/api/v1/accounts/logout', {
    method: 'POST',
    headers: jsonHeaders(token),
  });
}

export async function fetchCurrentAccount(token: string): Promise<Account> {
  const payload = await requestJson<AccountViewPayload>('/api/v1/accounts/me', {
    method: 'GET',
    headers: jsonHeaders(token),
  });
  return mapAccount(payload);
}

export async function updateShareSettings(
  token: string,
  isPublic: boolean
): Promise<Account> {
  const payload = await requestJson<AccountViewPayload>('/api/v1/accounts/me/share', {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ is_public: isPublic }),
  });
  return mapAccount(payload);
}
