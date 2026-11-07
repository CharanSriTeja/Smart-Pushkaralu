import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock native Expo modules before importing i18n
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn().mockRejectedValue(new Error('SQLite mock in test')),
}));

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
    addEventListener: vi.fn().mockReturnValue(() => {}),
  },
}));

vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getDevicePushTokenAsync: vi.fn().mockResolvedValue({ data: 'mock-fcm-token-123' }),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5 },
}));

import {
  validateIndianPhoneNumber,
  formatPhoneNumberForDisplay,
} from '../src/utils/validation';
import {
  calculateRemainingSeconds,
  canResendOtp,
  formatTimerDisplay,
} from '../src/utils/timer';
import i18n from '../src/i18n';
import en from '../src/i18n/en.json';
import te from '../src/i18n/te.json';
import hi from '../src/i18n/hi.json';
import { setCached, getCached, clearCache, fetchWithCache } from '../src/storage/cache';
import { apiRequest, AppApiError } from '../src/api/client';
import { theme } from '../src/theme';

describe('Mobile App Unit Tests (Smart Pushkaralu)', () => {
  describe('1. Phone Number Validation', () => {
    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () => {
      const validNumbers = [
        '9876543210',
        '8123456789',
        '7001122334',
        '6300123456',
      ];

      for (const num of validNumbers) {
        const result = validateIndianPhoneNumber(num);
        expect(result.isValid).toBe(true);
        expect(result.cleanNumber).toBe(num);
        expect(result.e164Format).toBe(`+91${num}`);
        expect(result.errorMessageKey).toBeUndefined();
      }
    });

    it('handles +91, 91, leading 0, spaces and hyphens correctly', () => {
      const formattedInputs = [
        '+91 98765 43210',
        '+91-9876543210',
        '919876543210',
        '09876543210',
        ' 98765 43210 ',
      ];

      for (const input of formattedInputs) {
        const result = validateIndianPhoneNumber(input);
        expect(result.isValid).toBe(true);
        expect(result.cleanNumber).toBe('9876543210');
        expect(result.e164Format).toBe('+919876543210');
      }
    });

    it('rejects numbers starting with invalid digits (1-5)', () => {
      const invalidStarters = ['1234567890', '2345678901', '5555555555'];
      for (const num of invalidStarters) {
        const result = validateIndianPhoneNumber(num);
        expect(result.isValid).toBe(false);
        expect(result.errorMessageKey).toBe('phone.error_invalid');
      }
    });

    it('rejects numbers with incorrect lengths or non-numeric characters', () => {
      const invalidLengths = ['98765', '9876543210123', '', 'abcdefghij'];
      for (const input of invalidLengths) {
        const result = validateIndianPhoneNumber(input);
        expect(result.isValid).toBe(false);
        expect(result.errorMessageKey).toBe('phone.error_invalid');
      }
    });

    it('formats 10-digit number for display', () => {
      expect(formatPhoneNumberForDisplay('9876543210')).toBe('+91 98765 43210');
      expect(formatPhoneNumberForDisplay('+919876543210')).toBe('+91 98765 43210');
    });
  });

  describe('2. OTP Resend Timer Logic', () => {
    it('calculates remaining seconds correctly from start time', () => {
      const now = 100000;
      const startedAt = now - 10000; // 10 seconds ago

      const remaining = calculateRemainingSeconds(startedAt, 30, now);
      expect(remaining).toBe(20);
    });

    it('clamps remaining seconds to 0 once cooldown has elapsed', () => {
      const now = 100000;
      const startedAt = now - 35000; // 35 seconds ago

      const remaining = calculateRemainingSeconds(startedAt, 30, now);
      expect(remaining).toBe(0);
    });

    it('evaluates canResendOtp accurately', () => {
      expect(canResendOtp(0)).toBe(true);
      expect(canResendOtp(-1)).toBe(true);
      expect(canResendOtp(1)).toBe(false);
      expect(canResendOtp(30)).toBe(false);
    });

    it('formats seconds into padded two-digit string', () => {
      expect(formatTimerDisplay(30)).toBe('30');
      expect(formatTimerDisplay(9)).toBe('09');
      expect(formatTimerDisplay(0)).toBe('00');
      expect(formatTimerDisplay(-5)).toBe('00');
    });
  });

  describe('3. i18n Fallback and Translation Consistency', () => {
    it('contains native speaker review comments in Telugu and Hindi files', () => {
      expect((te as any)._comment).toContain('Needs review by a native Telugu speaker');
      expect((hi as any)._comment).toContain('Needs review by a native Hindi speaker');
    });

    it('all three language files contain required module namespaces', () => {
      const namespaces = [
        'common',
        'auth',
        'ghats',
        'sos',
        'issues',
        'news',
        'seva',
        'planner',
        'transport',
        'settings',
      ];

      for (const ns of namespaces) {
        expect(en).toHaveProperty(ns);
        expect(te).toHaveProperty(ns);
        expect(hi).toHaveProperty(ns);
      }
    });

    it('falls back to English when a translation key is missing in Telugu or Hindi', async () => {
      await i18n.changeLanguage('te');
      expect(i18n.t('landing.app_name')).toBe('స్మార్ట్ పుష్కరాలు 2027');

      const testI18n = i18n.createInstance();
      await testI18n.init({
        lng: 'te',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              only_in_english: 'English Fallback Text',
            },
          },
          te: {
            translation: {},
          },
        },
      });

      expect(testI18n.t('only_in_english')).toBe('English Fallback Text');
    });
  });

  describe('4. Offline Storage Caching Layer', () => {
    beforeEach(async () => {
      await clearCache();
    });

    it('stores and retrieves cached data before TTL expires', async () => {
      await setCached('test-ghat', { name: 'Kotilingala Ghat', waterLevel: '12m' }, 60);
      const cached = await getCached<any>('test-ghat');
      expect(cached).toEqual({ name: 'Kotilingala Ghat', waterLevel: '12m' });
    });

    it('returns null when cached data has expired', async () => {
      // Set TTL of -10 seconds (already expired)
      await setCached('expired-key', { data: 'old' }, -10);
      const cached = await getCached('expired-key');
      expect(cached).toBeNull();
    });

    it('fetchWithCache returns cached data immediately and updates background', async () => {
      await setCached('corridor-status', { status: 'open' }, 300);

      const fetcher = vi.fn().mockResolvedValue({ status: 'open-crowded' });
      const onFresh = vi.fn();

      const result = await fetchWithCache('corridor-status', fetcher, {
        onFreshData: onFresh,
      });

      // Returns cached data immediately without waiting
      expect(result).toEqual({ status: 'open' });
      // Fetcher called for network refresh
      expect(fetcher).toHaveBeenCalled();
    });
  });

  describe('5. Resilient API Client', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('sends Accept-Language header matching current language', async () => {
      await i18n.changeLanguage('te');

      let capturedHeaders: any = null;
      (globalThis as any).fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedHeaders = options.headers;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ success: true }),
        };
      });

      const res = await apiRequest('/v1/health', 'GET');
      expect(res.success).toBe(true);
      expect(capturedHeaders['Accept-Language']).toBe('te');
    });

    it('retries on 500 error and succeeds on subsequent attempt', async () => {
      let callCount = 0;
      (globalThis as any).fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            text: async () => JSON.stringify({ error: { code: 'BUSY', message: 'Busy' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ recovered: true }),
        };
      });

      const res = await apiRequest('/v1/test', 'GET', undefined, { retries: 2 });
      expect(callCount).toBe(2);
      expect(res.recovered).toBe(true);
    });

    it('aborts and returns TIMEOUT_ERROR when request exceeds timeoutMs', async () => {
      (globalThis as any).fetch = vi.fn().mockImplementation((_url, { signal }) => {
        return new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            const err = new Error('The user aborted a request.');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      await expect(
        apiRequest('/v1/slow', 'GET', undefined, { timeoutMs: 20, retries: 0 })
      ).rejects.toThrow(AppApiError);
    });
  });

  describe('6. Theme and Accessibility Requirements', () => {
    it('enforces minimum touch targets of at least 48dp', () => {
      expect(theme.touchTarget.minHeight).toBeGreaterThanOrEqual(48);
      expect(theme.touchTarget.minWidth).toBeGreaterThanOrEqual(48);
    });

    it('defines high-contrast danger color for emergency SOS', () => {
      expect(theme.colors.danger).toBe('#DC2626');
      expect(theme.colors.primary).toBe('#0F52BA');
    });
  });
});
