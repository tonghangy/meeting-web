import { API_BASE, TOKEN_KEY, type ApiError } from './types';

export class ApiClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function authStreamUrl(path: string): string {
  const token = getToken();
  const normalized = path.startsWith('http')
    ? path
    : path.startsWith(API_BASE)
      ? path
      : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!token) return normalized;
  const sep = normalized.includes('?') ? '&' : '?';
  return `${normalized}${sep}_authToken=${encodeURIComponent(token)}`;
}

/** Backend returns `/app/api/.../download`; append token for `<a href>` / video src. */
export function authDownloadUrl(downloadUrl: string): string {
  if (!downloadUrl) return downloadUrl;
  if (downloadUrl.startsWith('http')) return authStreamUrl(downloadUrl);
  if (downloadUrl.startsWith(API_BASE)) return authStreamUrl(downloadUrl);
  if (downloadUrl.startsWith('/app/api')) return authStreamUrl(downloadUrl);
  return authStreamUrl(downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`);
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    return body.message || body.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set('X-Auth-Token', token);
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new ApiClientError(res.status, await parseError(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
