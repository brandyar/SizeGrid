import { isDesktopEnv } from '../../utils/desktop';

export const getDirectusUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_DIRECTUS_URL as string;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  // In Tauri / Desktop environment, send all Directus API requests directly to https://db.tankhor.com
  if (isDesktopEnv()) {
    return 'https://db.tankhor.com';
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')) {
    return `${window.location.origin}/api/directus`;
  }
  return 'https://db.tankhor.com';
};

export const DIRECTUS_URL = getDirectusUrl();

export interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
  token?: string | null;
  retries?: number;
}

/**
 * Enhanced Directus Fetch Client with Token Injection & Network Resilience
 */
export async function directusFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${DIRECTUS_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const { requiresAuth = false, token, retries = 1, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine && isDesktopEnv()) {
        throw new TypeError('Failed to fetch: Network offline');
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers
      });

      return response;
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt <= retries) {
        // Wait 300ms before retrying
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  throw lastError || new Error('Network error or server unreachable');
}
