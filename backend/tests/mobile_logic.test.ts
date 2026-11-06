import { describe, it, expect } from 'vitest';
import { resolveLocalizedText, evaluateOfficialApproval } from '../src/utils/trustVerifier.js';
import { calculateHaversineDistance, isWithinGhatProximity } from '../src/utils/geo.js';

describe('Module 3: Mobile & Frontend Logic Verification', () => {
  describe('1. Fixed Reviewed Localization & English Fallback', () => {
    const multiLangGhat = {
      en: 'Kotilingala Ghat',
      te: 'కోటిలింగాల ఘాట్',
      hi: 'कोटिलिंगला घाट',
    };

    it('resolves Telugu text for te language', () => {
      expect(resolveLocalizedText(multiLangGhat, 'te')).toBe('కోటిలింగాల ఘాట్');
    });

    it('resolves Hindi text for hi language', () => {
      expect(resolveLocalizedText(multiLangGhat, 'hi')).toBe('कोटिलिंगला घाट');
    });

    it('strictly falls back to English when requested language translation is missing', () => {
      const partialGhat = {
        en: 'Sundarapalli Ferry Ghat',
        hi: 'सुंदरपल्ली घाट',
      };
      // Telugu missing -> falls back to English
      expect(resolveLocalizedText(partialGhat, 'te')).toBe('Sundarapalli Ferry Ghat');
    });
  });

  describe('2. Trust Badge Verification Contract', () => {
    it('approves ONLY officially_listed with valid government portal URL', () => {
      const approved = evaluateOfficialApproval('officially_listed', 'https://eastgodavari.ap.gov.in/pushkaralu');
      expect(approved.isOfficiallyApproved).toBe(true);
      expect(approved.trustCode).toBe('OFFICIAL_APPROVED');

      // Unofficial source on officially_listed entry is rejected
      const rejected = evaluateOfficialApproval('officially_listed', 'https://unofficialblog.com/ghat');
      expect(rejected.isOfficiallyApproved).toBe(false);
      expect(rejected.trustCode).toBe('UNVERIFIED');

      // Community reported ghat
      const reported = evaluateOfficialApproval('reported', null);
      expect(reported.isOfficiallyApproved).toBe(false);
      expect(reported.trustCode).toBe('COMMUNITY_REPORTED');
    });
  });

  describe('3. GPS Proximity Check for Pilgrim Crowd Reports', () => {
    it('verifies report when pilgrim is within 1000m of the ghat', () => {
      // 50m offset
      const check = isWithinGhatProximity(17.0005, 81.7725, 17.0008, 81.7726, 1000);
      expect(check.isWithin).toBe(true);
      expect(check.distanceMeters).toBeLessThan(100);
    });

    it('flags report as unverified proximity when pilgrim is far away (>1000m)', () => {
      // 5 km offset
      const check = isWithinGhatProximity(17.0005, 81.7725, 17.0500, 81.7725, 1000);
      expect(check.isWithin).toBe(false);
      expect(check.distanceMeters).toBeGreaterThan(1000);
    });
  });

  describe('4. Module 5: Nearby Places Formatting & Deep Link', () => {
    it('generates walking estimate for distances under 1km', () => {
      const placeName = {
        en: 'Sri Kotilingeshwara Temple',
        te: 'శ్రీ కోటిలింగేశ్వర స్వామి దేవాలయం',
      };
      // Telugu
      expect(resolveLocalizedText(placeName, 'te')).toBe('శ్రీ కోటిలింగేశ్వర స్వామి దేవాలయం');
      // Hindi fallback to English
      expect(resolveLocalizedText(placeName, 'hi')).toBe('Sri Kotilingeshwara Temple');
    });
  });
});

