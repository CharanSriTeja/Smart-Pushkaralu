import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock native Expo & community modules before other imports
vi.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: vi.fn((key: string) => Promise.resolve(store[key] || null)),
    setItemAsync: vi.fn((key: string, val: string) => {
      store[key] = val;
      return Promise.resolve();
    }),
    deleteItemAsync: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    __clearStore: () => {
      store = {};
    },
  };
});

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
    addEventListener: vi.fn().mockReturnValue(() => {}),
  },
}));

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: vi.fn().mockResolvedValue({
    coords: { latitude: 17.0005, longitude: 81.7800, accuracy: 12 },
  }),
  Accuracy: { Balanced: 3 },
}));

vi.mock('expo-sms', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  sendSMSAsync: vi.fn().mockResolvedValue({ result: 'sent' }),
}));

import { SosService } from '../src/services/sosService';
import * as api from '../src/services/api';
import * as SecureStore from 'expo-secure-store';
import enTranslations from '../src/i18n/en.json';
import teTranslations from '../src/i18n/te.json';
import hiTranslations from '../src/i18n/hi.json';

describe('Module 7: Mobile SOS Flow & Offline Queue Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (SecureStore as any).__clearStore?.();
  });

  describe('1. Offline Queue & Sync Mechanism', () => {
    it('queues an alert in offline storage when network fails', async () => {
      // Mock network failure in apiRequest
      vi.spyOn(api, 'apiRequest').mockRejectedValue(new Error('Network request failed'));

      const result = await SosService.triggerSos({
        type: 'medical',
        channel: 'app',
        lat: 17.0005,
        lng: 81.7800,
      });

      expect(result.queued).toBe(true);
      expect(result.tempId).toBeDefined();

      const queue = await SosService.getOfflineQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe('medical');
      expect(queue[0].lat).toBe(17.0005);
      expect(queue[0].idempotencyKey).toBeDefined();
    });

    it('flushes offline queue when connection is restored', async () => {
      // Seed an offline queued alert
      await SosService.addToOfflineQueue({
        type: 'police',
        channel: 'app',
        zoneCode: 'G07',
      });

      expect((await SosService.getOfflineQueue()).length).toBe(1);

      // Mock successful API sync
      const apiSpy = vi.spyOn(api, 'apiRequest').mockResolvedValue({
        success: true,
        data: {
          id: 'server-sos-123',
          statusToken: 'tok-abc',
          status: 'new',
          type: 'police',
          channel: 'app',
          createdAt: new Date().toISOString(),
        },
      });

      const synced = await SosService.flushOfflineQueue();
      expect(synced).toBe(1);
      expect(apiSpy).toHaveBeenCalledWith('/v1/sos', expect.objectContaining({ method: 'POST' }));

      // Queue should now be empty
      const queueAfter = await SosService.getOfflineQueue();
      expect(queueAfter.length).toBe(0);
    });
  });

  describe('2. Active SOS Alert State Persistence', () => {
    it('persists active alert to local storage and allows clearing upon cancellation', async () => {
      const alertData = {
        id: 'sos-uuid-888',
        statusToken: 'tok-xyz',
        status: 'new' as const,
        type: 'fire' as const,
        channel: 'app' as const,
        createdAt: new Date().toISOString(),
      };

      await SosService.saveActiveAlert(alertData);
      const active = await SosService.getActiveAlert();
      expect(active).not.toBeNull();
      expect(active?.id).toBe('sos-uuid-888');
      expect(active?.type).toBe('fire');

      await SosService.clearActiveAlert();
      expect(await SosService.getActiveAlert()).toBeNull();
    });
  });

  describe('3. Built-in Emergency Helplines & 112 Priority', () => {
    it('always provides 112 as primary contact if backend is unreachable', async () => {
      vi.spyOn(api, 'apiRequest').mockRejectedValue(new Error('Network error'));

      const contacts = await SosService.getEmergencyContacts();
      expect(contacts.length).toBeGreaterThanOrEqual(1);
      expect(contacts[0].phone).toBe('112');
    });
  });

  describe('4. Localization & Safety Disclaimer Verification', () => {
    it('contains 112 non-replacement disclaimer in EN, TE, and HI', () => {
      expect(enTranslations.sos.official_disclaimer).toContain('112');
      expect(teTranslations.sos.official_disclaimer).toContain('112');
      expect(hiTranslations.sos.official_disclaimer).toContain('112');
    });

    it('contains all 5 categories in all 3 languages', () => {
      const categories = ['medical', 'police', 'fire', 'lost_person', 'general'];
      for (const cat of categories) {
        expect((enTranslations.sos.categories as any)[cat]).toBeDefined();
        expect((teTranslations.sos.categories as any)[cat]).toBeDefined();
        expect((hiTranslations.sos.categories as any)[cat]).toBeDefined();
      }
    });

    it('includes GPS privacy disclosure notice in all 3 languages', () => {
      expect(enTranslations.sos.gps_privacy_notice).toBeDefined();
      expect(teTranslations.sos.gps_privacy_notice).toBeDefined();
      expect(hiTranslations.sos.gps_privacy_notice).toBeDefined();
    });
  });
});
