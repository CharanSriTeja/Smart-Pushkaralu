import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock expo-secure-store for Node vitest runner
vi.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: vi.fn(async (key: string) => store.get(key) || null),
    setItemAsync: vi.fn(async (key: string, val: string) => {
      store.set(key, val);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

// Mock react-native-youtube-iframe
vi.mock('react-native-youtube-iframe', () => {
  return {
    default: 'YoutubePlayer',
  };
});

import { SevaService } from '../src/services/sevaService';
import { LocalizedSevaString } from '../src/types/seva';

describe('Mobile Module 10: Virtual Seva and Event Experience Tests', () => {
  describe('1. Multilingual Localization & Strict Fallback Rules', () => {
    it('resolves Telugu text when language is te', () => {
      const sample: LocalizedSevaString = {
        en: 'Godavari Maha Harathi',
        te: 'గోదావరి మహా హారతి',
        hi: 'गोदावरी महा आरती',
      };
      const resolved = SevaService.getLocalizedText(sample, 'te');
      expect(resolved).toBe('గోదావరి మహా హారతి');
    });

    it('resolves Hindi text when language is hi', () => {
      const sample: LocalizedSevaString = {
        en: 'Godavari Maha Harathi',
        te: 'గోదావరి మహా హారతి',
        hi: 'गोदावरी महा आरती',
      };
      const resolved = SevaService.getLocalizedText(sample, 'hi');
      expect(resolved).toBe('गोदावरी महा आरती');
    });

    it('strictly falls back to English when language is te but te translation is missing', () => {
      const sample: LocalizedSevaString = {
        en: 'VIP Snanam Guidelines',
        te: '',
      };
      const resolved = SevaService.getLocalizedText(sample, 'te', sample.en);
      expect(resolved).toBe('VIP Snanam Guidelines');
    });

    it('returns provided fallback if sample is undefined', () => {
      const resolved = SevaService.getLocalizedText(undefined, 'en', 'Default Fallback');
      expect(resolved).toBe('Default Fallback');
    });
  });

  describe('2. SevaService Offline Resilience & Data Contract', () => {
    it('returns curated Seva video feed with live streams prioritized', async () => {
      const res = await SevaService.getVideos();
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(4);

      // Verify at least one live stream is present and marked is_live
      const liveItem = res.data.find((v) => v.is_live);
      expect(liveItem).toBeDefined();
      expect(liveItem?.youtube_id).toBe('dQw4w9WgXcQ');
      expect(liveItem?.category).toBe('aarthi');
    });

    it('filters videos by category (e.g. aarthi)', async () => {
      const res = await SevaService.getVideos({ category: 'aarthi' });
      expect(res.data.length).toBeGreaterThan(0);
      res.data.forEach((v) => {
        expect(v.category).toBe('aarthi');
      });
    });

    it('filters videos by category (e.g. cultural)', async () => {
      const res = await SevaService.getVideos({ category: 'cultural' });
      expect(res.data.length).toBeGreaterThan(0);
      res.data.forEach((v) => {
        expect(v.category).toBe('cultural');
      });
    });

    it('verifies all YouTube IDs are valid 11-char strings and thumbnails are HTTPS', async () => {
      const res = await SevaService.getVideos();
      for (const item of res.data) {
        expect(item.youtube_id).toMatch(/^[a-zA-Z0-9_-]{11}$/);
        expect(item.thumbnail_url.startsWith('https://')).toBe(true);
        expect(item.thumbnail_url).toContain(item.youtube_id);
      }
    });

    it('verifies all videos have bilingual titles (English + Telugu)', async () => {
      const res = await SevaService.getVideos();
      for (const item of res.data) {
        expect(item.title_en || item.title?.en).toBeTruthy();
        expect(item.title_te || item.title?.te).toBeTruthy();
      }
    });
  });

  describe('3. YouTube URLs and Fallback Link Integrity', () => {
    it('ensures all videos possess valid official YouTube URLs for fallback viewing', async () => {
      const res = await SevaService.getVideos();
      for (const item of res.data) {
        expect(
          item.youtube_url.includes('youtube.com') || item.youtube_url.includes('youtu.be')
        ).toBe(true);
        expect(item.youtube_url.startsWith('https://')).toBe(true);
      }
    });
  });
});

