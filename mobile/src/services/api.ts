import { storage } from '../utils/storage';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'sp_refresh_token';
const USER_CACHE_KEY = 'sp_user_cache';

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:4000`;
  }
  if (Platform.OS === 'android') {
    if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('localhost') && !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    // Android emulator routes host machine loopback to 10.0.2.2
    return 'http://10.0.2.2:4000';
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://localhost:4000';
}

export function getBaseV1Url(): string {
  const base = getApiBaseUrl();
  return base.endsWith('/v1')
    ? base
    : `${base.replace(/\/+$/, '')}/v1`;
}

export const API_BASE_URL = getApiBaseUrl();
export const API_V1_URL = getBaseV1Url();

let inMemoryAccessToken: string | null = null;
let logoutCallback: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setInMemoryAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setLogoutHandler(callback: () => void) {
  logoutCallback = callback;
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await storage.getItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.warn('[Storage] Error reading refresh token:', err);
    return null;
  }
}

export async function setStoredRefreshToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await storage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await storage.deleteItem(REFRESH_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('[Storage] Error writing refresh token:', err);
  }
}

export async function getCachedUser(): Promise<any | null> {
  try {
    const raw = await storage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedUser(user: any | null): Promise<void> {
  try {
    if (user) {
      await storage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      await storage.deleteItem(USER_CACHE_KEY);
    }
  } catch (err) {
    console.warn('[Storage] Error caching user:', err);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await getStoredRefreshToken();
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh token rejected');
      }

      const data = await response.json();
      setInMemoryAccessToken(data.accessToken);
      if (data.refreshToken) {
        await setStoredRefreshToken(data.refreshToken);
      }
      return data.accessToken;
    } catch (err) {
      // Clear tokens and notify app of logout
      setInMemoryAccessToken(null);
      await setStoredRefreshToken(null);
      await setCachedUser(null);
      if (logoutCallback) {
        logoutCallback();
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth && inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error('Network request failed: ' + (err.message || 'Check connection'));
  }

  // Handle 401 Unauthorized -> Refresh token & retry once
  if (response.status === 401 && !options.skipAuth) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).code = data?.error?.code;
    throw error;
  }

  return data as T;
}
