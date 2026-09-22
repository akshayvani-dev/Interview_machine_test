const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
export const AUTH_TOKEN_KEY = 'auth_token';

interface ApiErrorResponse {
  message?: string;
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => null)) as ApiErrorResponse | T | null;

  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data
      ? data.message
      : undefined;
    throw new Error(message ?? 'Request failed');
  }

  return data as T;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}