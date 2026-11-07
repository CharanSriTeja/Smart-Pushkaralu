import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractYouTubeVideoId, validateYouTubeUrl } from '../src/modules/seva/youtube-validator.js';
import { sevaService } from '../src/modules/seva/seva.service.js';
import { sevaController } from '../src/modules/seva/seva.controller.js';
import { sevaRepository } from '../src/modules/seva/seva.repository.js';

// Mock Express Response helper
function createMockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
}

describe('Module 10: Virtual Seva & Event Experience Tests', () => {
  describe('1. Server-Side YouTube URL Parsing & Validation', () => {
    it('correctly extracts 11-char ID from youtu.be shortlinks', () => {
      const parsed1 = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');
      expect(parsed1).not.toBeNull();
      expect(parsed1?.videoId).toBe('dQw4w9WgXcQ');
      expect(parsed1?.sourceFormat).toBe('youtu.be');
      expect(parsed1?.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');

      // With query parameters
      const parsed2 = extractYouTubeVideoId('http://youtu.be/dQw4w9WgXcQ?si=abcdef123&t=45s');
      expect(parsed2?.videoId).toBe('dQw4w9WgXcQ');

      // Without protocol
      const parsed3 = extractYouTubeVideoId('youtu.be/dQw4w9WgXcQ');
      expect(parsed3?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('correctly extracts 11-char ID from youtube.com/watch standard links', () => {
      const parsed1 = extractYouTubeVideoId('https://www.youtube.com/watch?v=C0DPdy98e4c');
      expect(parsed1?.videoId).toBe('C0DPdy98e4c');
      expect(parsed1?.sourceFormat).toBe('watch');

      // With additional query parameters
      const parsed2 = extractYouTubeVideoId('https://youtube.com/watch?feature=share&v=C0DPdy98e4c&t=120');
      expect(parsed2?.videoId).toBe('C0DPdy98e4c');

      // Mobile subdomain
      const parsed3 = extractYouTubeVideoId('https://m.youtube.com/watch?v=C0DPdy98e4c');
      expect(parsed3?.videoId).toBe('C0DPdy98e4c');
    });

    it('correctly extracts 11-char ID from youtube.com/live streaming links', () => {
      const parsed1 = extractYouTubeVideoId('https://www.youtube.com/live/9bZkp7q19f0');
      expect(parsed1?.videoId).toBe('9bZkp7q19f0');
      expect(parsed1?.sourceFormat).toBe('live');
      expect(parsed1?.canonicalUrl).toBe('https://www.youtube.com/live/9bZkp7q19f0');

      // With query parameters
      const parsed2 = extractYouTubeVideoId('https://youtube.com/live/9bZkp7q19f0?feature=shared');
      expect(parsed2?.videoId).toBe('9bZkp7q19f0');
    });

    it('strictly rejects non-YouTube video platforms', () => {
      expect(validateYouTubeUrl('https://vimeo.com/123456789').isValid).toBe(false);
      expect(validateYouTubeUrl('https://dailymotion.com/video/x123abc').isValid).toBe(false);
      expect(validateYouTubeUrl('https://facebook.com/watch/?v=123456').isValid).toBe(false);
      expect(validateYouTubeUrl('https://attacker.com/watch?v=dQw4w9WgXcQ').isValid).toBe(false);
    });

    it('strictly rejects YouTube links that are not videos (channels, playlists, home)', () => {
      expect(validateYouTubeUrl('https://www.youtube.com').isValid).toBe(false);
      expect(validateYouTubeUrl('https://www.youtube.com/watch').isValid).toBe(false);
      expect(validateYouTubeUrl('https://www.youtube.com/live').isValid).toBe(false);
      expect(validateYouTubeUrl('https://www.youtube.com/channel/UC1234567890').isValid).toBe(false);
      expect(validateYouTubeUrl('https://www.youtube.com/playlist?list=PL1234567890').isValid).toBe(false);
    });

    it('strictly rejects malformed or invalid YouTube video IDs', () => {
      // Too short (< 11 chars)
      expect(validateYouTubeUrl('https://youtu.be/tooShort').isValid).toBe(false);
      // Too long (> 11 chars)
      expect(validateYouTubeUrl('https://youtube.com/watch?v=thisIdIsMuchTooLong12345').isValid).toBe(false);
      // Special invalid characters
      expect(validateYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXc!').isValid).toBe(false);
      // Empty or non-string
      expect(validateYouTubeUrl('').isValid).toBe(false);
      expect(validateYouTubeUrl(null as any).isValid).toBe(false);
    });
  });

  describe('2. Public Seva Feed & Publication Rules', () => {
    it('public feed returns only published videos and excludes drafts', async () => {
      const res = createMockResponse();
      const req: any = { query: {} };

      await sevaController.getPublicVideos(req, res);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);

      // Verify draft/unpublished is NOT included
      const draftVideo = res.body.data.find((v: any) => v.id === 'seva-draft-unpub-05');
      expect(draftVideo).toBeUndefined();

      // All returned videos must have published === true
      res.body.data.forEach((v: any) => {
        expect(v.published).toBe(true);
      });
    });

    it('public feed prioritizes live streams on top of the list', async () => {
      const res = createMockResponse();
      const req: any = { query: {} };

      await sevaController.getPublicVideos(req, res);

      expect(res.statusCode).toBe(200);
      const videos = res.body.data;
      expect(videos.length).toBeGreaterThan(0);

      // First video must be live
      expect(videos[0].is_live).toBe(true);
      expect(res.body.meta.live_count).toBeGreaterThanOrEqual(1);
    });

    it('supports category filtering (e.g., aarthi, pooja, cultural)', async () => {
      const res = createMockResponse();
      const req: any = { query: { category: 'aarthi' } };

      await sevaController.getPublicVideos(req, res);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((v: any) => {
        expect(v.category).toBe('aarthi');
      });
    });

    it('supports live filter (live=true)', async () => {
      const res = createMockResponse();
      const req: any = { query: { live: 'true' } };

      await sevaController.getPublicVideos(req, res);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((v: any) => {
        expect(v.is_live).toBe(true);
      });
    });

    it('returns 404 for an unpublished video when queried by public endpoint', async () => {
      const res = createMockResponse();
      const req: any = { params: { id: 'seva-draft-unpub-05' } };

      await sevaController.getPublicVideoById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns published video by ID with complete multilingual titles and descriptions', async () => {
      const res = createMockResponse();
      const req: any = { params: { id: 'seva-live-harathi-01' } };

      await sevaController.getPublicVideoById(req, res);

      expect(res.statusCode).toBe(200);
      const video = res.body.data;
      expect(video.id).toBe('seva-live-harathi-01');
      expect(video.title.en).toBe('Maha Pushkar Godavari Harathi - Live Evening Darshan');
      expect(video.title.te).toContain('మహా పుష్కర గోదావరి హారతి');
      expect(video.title.hi).toContain('महा पुष्कर गोदावरी');
      expect(video.youtube_id).toBe('dQw4w9WgXcQ');
    });
  });

  describe('3. Admin CRUD, Audit Logging & Validation Rules', () => {
    it('admin feed includes drafts as well as published videos', async () => {
      const res = createMockResponse();
      const req: any = {
        user: { userId: 'admin-super-01', isAdmin: true },
        query: {},
      };

      await sevaController.getAdminVideos(req, res);

      expect(res.statusCode).toBe(200);
      const draft = res.body.data.find((v: any) => v.id === 'seva-draft-unpub-05');
      expect(draft).toBeDefined();
      expect(draft.published).toBe(false);
    });

    it('rejects video creation if URL is not a valid YouTube link', async () => {
      const res = createMockResponse();
      const req: any = {
        user: { userId: 'admin-super-01', isAdmin: true },
        body: {
          url: 'https://vimeo.com/987654321',
          title_en: 'Invalid Video Test',
          title_te: 'చెల్లని వీడియో',
          category: 'general',
        },
      };

      await sevaController.createAdminVideo(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('INVALID_YOUTUBE_URL');
    });

    it('rejects video creation if required English or Telugu title is missing', async () => {
      const res = createMockResponse();
      const req: any = {
        user: { userId: 'admin-super-01', isAdmin: true },
        body: {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          title_en: 'Only English Title',
          // title_te is missing
          category: 'pooja',
        },
      };

      await sevaController.createAdminVideo(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Telugu');
    });

    it('successfully creates a new Seva video from a valid youtu.be link', async () => {
      const res = createMockResponse();
      const req: any = {
        user: { userId: 'admin-super-01', isAdmin: true },
        body: {
          url: 'https://youtu.be/kJQP7kiw5Fk?si=demo123',
          title_en: 'VIP Snanam Highlights',
          title_te: 'వీఐపీ స్నానాల విశేషాలు',
          title_hi: 'वीआईपी स्नान झलकियाँ',
          category: 'snanam',
          is_live: false,
          published: true,
          sort_order: 10,
          reason: 'Added official VIP ghat snanam footage',
        },
      };

      await sevaController.createAdminVideo(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.youtube_id).toBe('kJQP7kiw5Fk');
      expect(res.body.data.thumbnail_url).toBe('https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg');
      expect(res.body.data.title.en).toBe('VIP Snanam Highlights');
      expect(res.body.data.title.te).toBe('వీఐపీ స్నానాల విశేషాలు');

      const createdId = res.body.data.id;

      // Now update the created video via PATCH
      const patchRes = createMockResponse();
      const patchReq: any = {
        params: { id: createdId },
        user: { userId: 'admin-super-01', isAdmin: true },
        body: {
          title_en: 'VIP Snanam Highlights - Updated',
          is_live: true,
          reason: 'Updated to live flag',
        },
      };

      await sevaController.patchAdminVideo(patchReq, patchRes);
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.data.title.en).toBe('VIP Snanam Highlights - Updated');
      expect(patchRes.body.data.is_live).toBe(true);

      // Now delete via DELETE
      const deleteRes = createMockResponse();
      const deleteReq: any = {
        params: { id: createdId },
        user: { userId: 'admin-super-01', isAdmin: true },
        query: { reason: 'Cleaning up test record' },
      };

      await sevaController.deleteAdminVideo(deleteReq, deleteRes);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it('successfully reorders video sequence', async () => {
      const res = createMockResponse();
      const req: any = {
        user: { userId: 'admin-super-01', isAdmin: true },
        body: {
          items: [
            { id: 'seva-live-harathi-01', sort_order: 10 },
            { id: 'seva-kotilingala-rudrabhishekam-02', sort_order: 1 },
          ],
        },
      };

      await sevaController.reorderAdminVideos(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

