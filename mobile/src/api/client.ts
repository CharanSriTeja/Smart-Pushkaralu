import i18n from '../i18n';
import { getInMemoryAccessToken } from '../services/api';
import { Platform } from 'react-native';

export class AppApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getBaseApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  skipAuth?: boolean;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Universal resilient API fetcher with token attachment, Accept-Language,
 * timeout aborts, and safe retries on network failures.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 10000,
    retries = 2,
    skipAuth = false,
    headers: customHeaders = {},
  } = options;

  const baseUrl = getBaseApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const currentLang = i18n.language || 'en';
  const token = !skipAuth ? getInMemoryAccessToken() : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': currentLang,
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? (typeof body === 'string' || body instanceof FormData ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      let responseData: any = null;
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : null;
      } catch {
        responseData = { message: text };
      }

      if (!response.ok) {
        const errorCode = responseData?.error?.code || `HTTP_${response.status}`;
        const errorMessage = responseData?.error?.message || responseData?.message || 'Server request failed';
        
        // 5xx errors or 429 are retried
        if (response.status >= 500 && attempt < retries) {
          attempt++;
          await sleep(Math.min(1000 * Math.pow(2, attempt), 3000));
          continue;
        }

        throw new AppApiError(errorMessage, errorCode, response.status, responseData?.error?.details);
      }

      return responseData as T;
    } catch (err: any) {
      clearTimeout(timer);

      // Handle aborted timeout
      if (err.name === 'AbortError') {
        lastError = new AppApiError('Request timed out. Please check your internet connection.', 'TIMEOUT_ERROR', 408);
      } else if (err instanceof AppApiError) {
        lastError = err;
        // Don't retry 4xx errors
        if (err.status < 500) {
          throw err;
        }
      } else {
        lastError = new AppApiError(err.message || 'Network request failed', 'NETWORK_ERROR', 0);
      }

      if (attempt < retries) {
        attempt++;
        await sleep(Math.min(1000 * Math.pow(2, attempt), 3000));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'GET', undefined, options),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'POST', body, options),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'PATCH', body, options),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, 'DELETE', undefined, options),
};

