import { describe, it, expect, vi } from 'vitest';

// Mock native Expo modules before importing i18n
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
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

describe('Mobile App Unit Tests', () => {
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

    it('falls back to English when a translation key is missing in Telugu or Hindi', async () => {
      // Set to Telugu
      await i18n.changeLanguage('te');

      // Common existing key in Telugu
      expect(i18n.t('landing.app_name')).toBe('స్మార్ట్ పుష్కరాలు 2027');

      // Create a test instance with an intentional missing key in te
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
            translation: {}, // key missing here
          },
        },
      });

      expect(testI18n.t('only_in_english')).toBe('English Fallback Text');
    });

    it('all three language files contain required core sections', () => {
      const coreSections = ['landing', 'phone', 'otp', 'register', 'home', 'guest'];

      for (const section of coreSections) {
        expect(en).toHaveProperty(section);
        expect(te).toHaveProperty(section);
        expect(hi).toHaveProperty(section);
      }
    });
  });
});
