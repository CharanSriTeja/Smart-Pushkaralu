import { describe, it, expect } from 'vitest';
import { getLocalizedText, formatVerifiedDate } from '../src/utils/localized';
import { calculateHaversineDistance, isWithinGhatProximity } from '../../backend/src/utils/geo';
import { evaluateOfficialApproval } from '../../backend/src/utils/trustVerifier';

describe('Mobile Module 3: Ghats & Localization Tests', () => {
  describe('1. Localization & English Fallback Rule', () => {
    it('returns Telugu when language is te and te is present', () => {
      const field = {
        en: 'Pushkar Ghat',
        te: 'పుష్కర్ ఘాట్',
        hi: 'पुष्कर घाट',
      };
      expect(getLocalizedText(field, 'te')).toBe('పుష్కర్ ఘాట్');
    });

    it('returns Hindi when language is hi and hi is present', () => {
      const field = {
        en: 'Pushkar Ghat',
        te: 'పుష్కర్ ఘాట్',
        hi: 'पुष्कर घाट',
      };
      expect(getLocalizedText(field, 'hi')).toBe('पुष्कर घाट');
    });

    it('strictly falls back to English when language is te but te string is missing', () => {
      const field = {
        en: 'Sundarapalli Ferry Ghat',
        // te is missing
        hi: 'सुंदरपल्ली घाट',
      };
      expect(getLocalizedText(field, 'te')).toBe('Sundarapalli Ferry Ghat');
    });

    it('strictly falls back to English when language is hi but hi string is empty', () => {
      const field = {
        en: 'Peruru Godavari Ghat',
        te: 'పేరూరు గోదావరి ఘాట్',
        hi: '',
      };
      expect(getLocalizedText(field, 'hi')).toBe('Peruru Godavari Ghat');
    });
  });

  describe('2. Trust Badge Verification Rule', () => {
    it('only approves ghat when officially_listed AND backed by official government URL', () => {
      const valid = evaluateOfficialApproval(
        'officially_listed',
        'https://eastgodavari.ap.gov.in/pushkaralu'
      );
      expect(valid.isOfficiallyApproved).toBe(true);
      expect(valid.trustCode).toBe('OFFICIAL_APPROVED');

      // Unofficial source on officially_listed entry
      const invalidSource = evaluateOfficialApproval(
        'officially_listed',
        'https://travel-blog.com/kotilingala'
      );
      expect(invalidSource.isOfficiallyApproved).toBe(false);
      expect(invalidSource.trustCode).toBe('UNVERIFIED');

      // Unverified entry
      const unverified = evaluateOfficialApproval('unverified', null);
      expect(unverified.isOfficiallyApproved).toBe(false);
      expect(unverified.trustCode).toBe('UNVERIFIED');
    });
  });

  describe('3. GPS Proximity Check Rule for Mobile Reports', () => {
    it('approves reports within 1000m of the ghat', () => {
      // 50m distance
      const check = isWithinGhatProximity(17.0005, 81.7725, 17.0008, 81.7726, 1000);
      expect(check.isWithin).toBe(true);
      expect(check.distanceMeters).toBeLessThan(100);
    });

    it('flags reports beyond 1000m as unverified proximity', () => {
      // 5 km distance
      const check = isWithinGhatProximity(17.0005, 81.7725, 17.0500, 81.7725, 1000);
      expect(check.isWithin).toBe(false);
      expect(check.distanceMeters).toBeGreaterThan(1000);
    });
  });
});

